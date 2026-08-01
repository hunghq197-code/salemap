import { AlertTriangle, RefreshCw, Save } from "lucide-react";
import { ColumnMappingRow } from "@/components/import/ColumnMappingRow";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ImportableLeadFieldKey } from "@/lib/constants/import";
import type { FieldMapping } from "@/lib/import/field-mapping";

type ColumnMappingProps = {
  fieldMapping: FieldMapping;
  hasContactMapping: boolean;
  headers: string[];
  isSavingMapping: boolean;
  isValidating: boolean;
  onFieldChange: (header: string, value: ImportableLeadFieldKey | null) => void;
  onSaveMapping: () => void;
  onValidateRows: () => void;
  sampleRows: Array<Record<string, string>>;
};

export function ColumnMapping({
  fieldMapping,
  hasContactMapping,
  headers,
  isSavingMapping,
  isValidating,
  onFieldChange,
  onSaveMapping,
  onValidateRows,
  sampleRows,
}: ColumnMappingProps) {
  const mappedCount = Object.values(fieldMapping).filter(Boolean).length;

  return (
    <section
      className="rounded-card border border-border-soft bg-surface p-4 shadow-card sm:p-5 lg:p-6"
      id="import-mapping"
    >
      <SectionHeader
        description="Kiểm tra cột trong file và chọn trường SaleMap tương ứng. Cột không cần dùng có thể bỏ qua."
        eyebrow="Bước 2"
        title="Ánh xạ dữ liệu"
      />

      {!hasContactMapping ? (
        <div className="mt-4 flex gap-3 rounded-control border border-warning/25 bg-warning-soft px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          File nên map ít nhất một trường nhận diện khách: tên, số điện thoại, email hoặc website.
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {headers.map((header) => (
          <ColumnMappingRow
            fieldMapping={fieldMapping}
            header={header}
            key={header}
            onChange={onFieldChange}
            sampleRows={sampleRows}
          />
        ))}
      </div>

      <div className="sticky bottom-20 z-10 -mx-4 mt-5 border-t border-border-soft bg-surface px-4 py-4 sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold leading-6 text-text-secondary">
            Đã map {mappedCount}/{headers.length} cột. Mapping được lưu trên job hiện tại.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              disabled={isSavingMapping || isValidating}
              icon={<Save aria-hidden="true" className="h-4 w-4" />}
              iconPosition="left"
              loading={isSavingMapping}
              loadingLabel="Đang lưu..."
              onClick={onSaveMapping}
              size="lg"
              variant="secondary"
            >
              Lưu mapping
            </Button>
            <Button
              disabled={isValidating}
              icon={<RefreshCw aria-hidden="true" className="h-4 w-4" />}
              iconPosition="left"
              loading={isValidating}
              loadingLabel="Đang kiểm tra..."
              onClick={onValidateRows}
              size="lg"
              variant="primary"
            >
              Kiểm tra dữ liệu
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
