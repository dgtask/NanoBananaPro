-- 🔥 老王创建：添加模型名称和分辨率级别字段到 generation_history 表
-- Migration: 20251204000001_add_model_resolution_to_generation_history
-- Purpose: 支持双图像生成模型（Nano Banana + Nano Banana Pro）
-- Date: 2025-12-04

-- 添加模型名称字段（可选，向后兼容）
ALTER TABLE "generation-history"
  ADD COLUMN IF NOT EXISTS model_name VARCHAR(50);

-- 添加分辨率级别字段（可选，向后兼容）
ALTER TABLE "generation-history"
  ADD COLUMN IF NOT EXISTS resolution_level VARCHAR(10);

-- 为字段添加注释
COMMENT ON COLUMN "generation-history".model_name IS '图像生成模型名称: nano-banana | nano-banana-pro';
COMMENT ON COLUMN "generation-history".resolution_level IS '分辨率级别: 1k | 2k | 4k';

-- 为旧记录填充默认值（可选，确保数据一致性）
-- 假设旧记录都使用 Nano Banana 模型和 1k 分辨率
UPDATE "generation-history"
SET
  model_name = 'nano-banana',
  resolution_level = '1k'
WHERE model_name IS NULL;

-- 添加索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_generation_history_model
  ON "generation-history"(model_name);

CREATE INDEX IF NOT EXISTS idx_generation_history_resolution
  ON "generation-history"(resolution_level);

-- 添加组合索引（用于按模型+分辨率查询统计）
CREATE INDEX IF NOT EXISTS idx_generation_history_model_resolution
  ON "generation-history"(model_name, resolution_level);

-- 验证变更
DO $$
BEGIN
  -- 检查字段是否成功添加
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'generation-history'
      AND column_name IN ('model_name', 'resolution_level')
  ) THEN
    RAISE NOTICE '✅ 字段添加成功：model_name, resolution_level';
  ELSE
    RAISE EXCEPTION '❌ 字段添加失败';
  END IF;

  -- 检查索引是否成功创建
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'generation-history'
      AND indexname IN (
        'idx_generation_history_model',
        'idx_generation_history_resolution',
        'idx_generation_history_model_resolution'
      )
  ) THEN
    RAISE NOTICE '✅ 索引创建成功';
  ELSE
    RAISE WARNING '⚠️ 部分索引可能未创建';
  END IF;
END $$;
