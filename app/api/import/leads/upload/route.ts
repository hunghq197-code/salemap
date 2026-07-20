import { NextResponse } from "next/server";
import { IMPORT_FILE_LIMITS } from "@/lib/constants/import";
import { createImportJob } from "@/lib/data/import-jobs";
import { createImportRows } from "@/lib/data/import-rows";
import { getPlanForCurrentUser } from "@/lib/data/subscriptions";
import { suggestFieldMapping } from "@/lib/import/field-mapping";
import { ImportParseError, parseImportFile } from "@/lib/import/parse-file";
import { enforceSameOrigin, rateLimit } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function errorResponse(message: string, code = "IMPORT_UPLOAD_FAILED", status = 400) {
  return NextResponse.json(
    {
      error: code,
      message,
      success: false,
    },
    { status },
  );
}

function isSupportedFileName(fileName: string) {
  return /\.(csv|xlsx)$/i.test(fileName);
}

function parseErrorMessage(error: unknown) {
  if (error instanceof ImportParseError) {
    if (error.code === "UNSUPPORTED_FILE_TYPE") {
      return "Chỉ hỗ trợ file CSV hoặc XLSX.";
    }

    return "Không thể đọc file này. Vui lòng kiểm tra định dạng CSV/XLSX và thử lại.";
  }

  return "Không thể đọc file này. Vui lòng kiểm tra định dạng CSV/XLSX và thử lại.";
}

export async function POST(request: Request) {
  const originError = enforceSameOrigin(request);

  if (originError) {
    return originError;
  }

  const rateLimitError = rateLimit(request, {
    key: "lead-import-upload",
    limit: 6,
    message: "Bạn đã import nhiều lần. Vui lòng chờ một lát rồi thử lại.",
    windowMs: 10 * 60 * 1000,
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse("Bạn cần đăng nhập để import dữ liệu.", "UNAUTHORIZED", 401);
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return errorResponse("Vui lòng chọn file CSV hoặc XLSX.");
  }

  if (!isSupportedFileName(file.name)) {
    return errorResponse("Chỉ hỗ trợ file CSV hoặc XLSX.", "UNSUPPORTED_FILE_TYPE");
  }

  const plan = await getPlanForCurrentUser();
  const limits = IMPORT_FILE_LIMITS[plan.key];

  if (file.size > limits.maxFileSizeBytes) {
    return errorResponse(
      "File quá lớn. Vui lòng giảm số dòng hoặc chia nhỏ file trước khi import.",
      "FILE_TOO_LARGE",
    );
  }

  try {
    const parsed = await parseImportFile(file, file.name, {
      maxRows: limits.maxRows,
    });

    if (parsed.totalRows > limits.maxRows) {
      return errorResponse(
        "File quá lớn. Vui lòng giảm số dòng hoặc chia nhỏ file trước khi import.",
        "TOO_MANY_ROWS",
      );
    }

    const suggestedMapping = suggestFieldMapping(parsed.headers);
    const job = await createImportJob({
      fieldMapping: suggestedMapping,
      fileName: file.name,
      fileSizeBytes: file.size,
      fileType: parsed.fileType,
      sampleRows: parsed.sampleRows,
      status: "previewed",
      totalRows: parsed.totalRows,
    });

    await createImportRows(
      job.id,
      parsed.rows.map((row, index) => ({
        rawData: row,
        rowIndex: index + 2,
      })),
    );

    return NextResponse.json({
      data: {
        headers: parsed.headers,
        jobId: job.id,
        sampleRows: parsed.sampleRows,
        suggestedMapping,
        totalRows: parsed.totalRows,
      },
      success: true,
    });
  } catch (error) {
    return errorResponse(parseErrorMessage(error), "FILE_PARSE_FAILED");
  }
}
