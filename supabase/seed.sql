insert into public.ai_models (slug, name, provider, description, context_window, is_enabled, is_free, sort_order)
values (
  'z-ai/glm-5.3-flash',
  'GLM 5.3 Flash',
  'nvidia-nim',
  'النموذج الافتراضي. متوافق مع OpenAI عبر NVIDIA NIM ويجب أن يطابق AI_MODEL.',
  128000,
  true,
  true,
  1
)
on conflict (slug) do update set
  is_enabled = true,
  name = excluded.name,
  provider = excluded.provider,
  description = excluded.description;

insert into public.ai_models (slug, name, provider, description, context_window, is_enabled, is_free, sort_order)
values (
  'openai/gpt-oss-20b',
  'GPT-OSS 20B',
  'nvidia-nim',
  'بديل مفتوح عبر NVIDIA NIM. قد يتأخر أول رمز عند البداية الباردة.',
  128000,
  true,
  true,
  2
)
on conflict (slug) do update set
  is_enabled = true,
  name = excluded.name,
  provider = excluded.provider,
  description = excluded.description;

update public.system_settings set default_model = 'z-ai/glm-5.3-flash' where id = 1;

update public.ai_models set is_enabled = false where slug not in ('z-ai/glm-5.3-flash', 'openai/gpt-oss-20b');
