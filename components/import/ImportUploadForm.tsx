import { ImportDropzone } from "@/components/import/ImportDropzone";

type ImportUploadFormProps = {
  disabledReason?: string | null;
  maxFileSizeBytes: number;
  maxRows: number;
  sampleHref?: string;
};

export function ImportUploadForm(props: ImportUploadFormProps) {
  return <ImportDropzone {...props} />;
}
