import { ar } from "@/messages/ar";
import { requireAdmin } from "@/server/auth";
import { listModels } from "@/server/repositories/models";
import { getSystemSettings } from "@/server/repositories/settings";
import { AdminModelsList } from "@/components/admin/AdminModelsList";

export default async function AdminModelsPage() {
  await requireAdmin();

  const [models, settings] = await Promise.all([listModels(), getSystemSettings()]);
  const defaultModel = settings?.default_model ?? "";

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">{ar.admin.models.title}</h1>
      <p className="mb-4 text-sm text-ink-2">{ar.admin.models.note}</p>
      <AdminModelsList
        models={models.map((model) => ({
          slug: model.slug,
          name: model.name,
          provider: model.provider,
          contextWindow: model.context_window,
          isEnabled: model.is_enabled,
          isDefault: model.slug === defaultModel,
        }))}
      />
    </div>
  );
}
