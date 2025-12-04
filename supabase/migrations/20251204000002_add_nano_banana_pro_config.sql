-- 🔥 老王创建：添加 Nano Banana Pro 模型配置到 system_configs 表
-- Migration: 20251204000002_add_nano_banana_pro_config
-- Purpose: 为 Gemini 3 Pro Image Preview 模型添加系统配置
-- Date: 2025-12-04

-- 注意：api_key_encrypted 字段需要使用实际的加密后的 API Key
-- 执行前需要先获取加密后的 Google AI API Key

-- 添加 Nano Banana Pro 配置
INSERT INTO system_configs (
  config_key,
  config_value,
  description,
  is_encrypted,
  updated_at
) VALUES (
  'llm.image_generation.google.pro',
  jsonb_build_object(
    'provider', 'google',
    'service_type', 'image_generation',
    'api_url', 'https://generativelanguage.googleapis.com',
    'model_name', 'gemini-3-pro-image-preview',
    'timeout', 60000,
    'api_key_encrypted', '${ENCRYPTED_API_KEY}'  -- 🔥 需要替换为实际加密的 API Key
  ),
  'Gemini 3 Pro Image Preview 配置（Nano Banana Pro）- 支持 2k/4k 分辨率',
  true,
  NOW()
)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 验证配置是否成功插入
DO $$
DECLARE
  config_exists BOOLEAN;
BEGIN
  -- 检查配置键是否存在
  SELECT EXISTS (
    SELECT 1
    FROM system_configs
    WHERE config_key = 'llm.image_generation.google.pro'
  ) INTO config_exists;

  IF config_exists THEN
    RAISE NOTICE '✅ Nano Banana Pro 配置添加成功';
    RAISE NOTICE 'ℹ️ 配置键: llm.image_generation.google.pro';
    RAISE NOTICE 'ℹ️ 模型名称: gemini-3-pro-image-preview';
    RAISE NOTICE '⚠️ 警告: 请确保 api_key_encrypted 字段已更新为实际加密的 API Key';
  ELSE
    RAISE EXCEPTION '❌ Nano Banana Pro 配置添加失败';
  END IF;
END $$;

-- 添加注释说明
COMMENT ON TABLE system_configs IS '系统配置表 - 存储 LLM 模型配置、支付配置等';

-- 显示当前所有图像生成相关配置
DO $$
DECLARE
  config_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 当前图像生成模型配置列表:';
  RAISE NOTICE '----------------------------------------';

  FOR config_record IN
    SELECT
      config_key,
      config_value->>'model_name' AS model_name,
      description
    FROM system_configs
    WHERE config_key LIKE 'llm.image_generation%'
    ORDER BY config_key
  LOOP
    RAISE NOTICE '  • %: % (%)',
      config_record.config_key,
      config_record.model_name,
      config_record.description;
  END LOOP;

  RAISE NOTICE '----------------------------------------';
END $$;
