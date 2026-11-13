import { EditorPage } from "@/components/editor-page";
export default async function EditArticle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <EditorPage id={(await params).id} />;
}
