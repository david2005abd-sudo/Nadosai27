insert into public.ai_models (slug, name, provider, description, context_window, is_enabled, is_free, sort_order)
values (
  'gpt-4o-mini',
  'GPT-4o mini',
  'openai-compatible',
  'النموذج الافتراضي. يجب أن يطابق AI_MODEL في بيئة الخادم أو عدّل slug هذا الصف.',
  128000,
  true,
  true,
  1
)
on conflict (slug) do update set is_enabled = true;
