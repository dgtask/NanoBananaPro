#!/usr/bin/env tsx
/**
 * 🔥 老王的智能页面迁移脚本
 * 用途：自动迁移页面从 app/ 到 app/[locale]/，并修改代码支持 locale 参数
 * 运行：pnpm tsx scripts/migrate-pages-auto.ts
 * 警告：运行前请先提交代码到 Git！
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '..')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
}

// 查找所有需要迁移的页面
async function findPagesToMigrate(): Promise<string[]> {
  const pages: string[] = []

  async function scanDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      // 跳过 [locale] 目录和 api 目录
      if (entry.name === '[locale]' || entry.name === 'api') {
        continue
      }

      if (entry.isDirectory()) {
        await scanDir(fullPath)
      } else if (entry.name === 'page.tsx') {
        // 跳过根页面（已经迁移）
        if (fullPath !== path.join(PROJECT_ROOT, 'app', 'page.tsx')) {
          pages.push(fullPath)
        }
      }
    }
  }

  await scanDir(path.join(PROJECT_ROOT, 'app'))
  return pages
}

// 检查页面是否是客户端组件
async function isClientComponent(filePath: string): Promise<boolean> {
  const content = await fs.readFile(filePath, 'utf-8')
  return content.trim().startsWith('"use client"') || content.trim().startsWith("'use client'")
}

// 检查页面是否已经使用 next-intl
async function usesNextIntl(filePath: string): Promise<boolean> {
  const content = await fs.readFile(filePath, 'utf-8')
  return content.includes('from \'next-intl\'') || content.includes('from "next-intl"')
}

// 转换页面代码以支持 locale 参数（仅针对服务器组件）
function transformServerComponent(content: string): string {
  // 如果已经有 params 参数，跳过
  if (content.includes('params: Promise<{ locale:')) {
    return content
  }

  // 查找默认导出的函数
  const exportDefaultRegex = /export\s+default\s+(?:async\s+)?function\s+(\w+)\s*\(/
  const match = content.match(exportDefaultRegex)

  if (!match) {
    log.warn('未找到默认导出函数，跳过修改')
    return content
  }

  const functionName = match[1]

  // 添加导入（如果还没有）
  let updatedContent = content
  if (!updatedContent.includes('setRequestLocale')) {
    // 在第一个 import 之后添加
    const firstImportIndex = updatedContent.indexOf('import ')
    if (firstImportIndex !== -1) {
      const firstLineBreak = updatedContent.indexOf('\n', firstImportIndex)
      updatedContent =
        updatedContent.slice(0, firstLineBreak + 1) +
        `import { setRequestLocale } from 'next-intl/server'\n` +
        updatedContent.slice(firstLineBreak + 1)
    }
  }

  // 修改函数签名
  const functionRegex = new RegExp(
    `export\\s+default\\s+(async\\s+)?function\\s+${functionName}\\s*\\(([^)]*)\\)`,
    'g'
  )

  updatedContent = updatedContent.replace(functionRegex, (match, asyncKeyword, params) => {
    const isAsync = asyncKeyword ? 'async ' : ''
    const hasParams = params.trim().length > 0

    // 构建新的参数
    const newParams = hasParams
      ? `${params}, {\n  params,\n}: {\n  params: Promise<{ locale: string }>\n}`
      : `{\n  params,\n}: {\n  params: Promise<{ locale: string }>\n}`

    return `export default ${isAsync}function ${functionName}(${newParams})`
  })

  // 在函数体开头添加 locale 提取和 setRequestLocale
  const functionBodyRegex = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*{`)
  updatedContent = updatedContent.replace(functionBodyRegex, (match) => {
    return (
      match +
      `\n  const { locale } = await params\n  setRequestLocale(locale)\n`
    )
  })

  // 确保函数是 async 的
  if (!updatedContent.includes(`export default async function ${functionName}`)) {
    updatedContent = updatedContent.replace(
      `export default function ${functionName}`,
      `export default async function ${functionName}`
    )
  }

  return updatedContent
}

// 迁移单个页面
async function migratePage(sourceFile: string): Promise<boolean> {
  try {
    // 计算相对路径
    const relativePath = path.relative(path.join(PROJECT_ROOT, 'app'), sourceFile)
    const targetPath = path.join(PROJECT_ROOT, 'app', '[locale]', relativePath)

    // 检查目标文件是否已存在
    const targetExists = await fs.access(targetPath).then(() => true).catch(() => false)
    if (targetExists) {
      log.warn(`跳过：${relativePath}（目标已存在）`)
      return false
    }

    // 读取源文件
    const content = await fs.readFile(sourceFile, 'utf-8')

    // 判断是客户端还是服务器组件
    const isClient = await isClientComponent(sourceFile)
    const hasNextIntl = await usesNextIntl(sourceFile)

    let transformedContent = content

    // 如果是服务器组件，添加 locale 参数支持
    if (!isClient) {
      transformedContent = transformServerComponent(content)
    }

    // 创建目标目录
    await fs.mkdir(path.dirname(targetPath), { recursive: true })

    // 写入目标文件
    await fs.writeFile(targetPath, transformedContent, 'utf-8')

    const status = isClient ? '(客户端)' : '(服务器)'
    const i18nStatus = hasNextIntl ? ' [已用next-intl]' : ''
    log.success(`迁移成功：${relativePath} ${status}${i18nStatus}`)

    return true
  } catch (error) {
    log.error(`迁移失败：${sourceFile}`)
    console.error(error)
    return false
  }
}

// 主函数
async function main() {
  console.log('🔥 老王的智能页面迁移工具启动！\n')

  // 1. 查找所有需要迁移的页面
  log.info('扫描需要迁移的页面...')
  const pages = await findPagesToMigrate()
  console.log(`\n找到 ${pages.length} 个需要迁移的页面\n`)

  // 2. 确认迁移
  console.log('⚠️  这将执行以下操作：')
  console.log('  1. 复制页面文件到 app/[locale]/ 目录')
  console.log('  2. 为服务器组件添加 locale 参数支持')
  console.log('  3. 保留原文件（需手动删除）\n')

  // 显示前10个页面
  console.log('示例页面（前10个）：')
  pages.slice(0, 10).forEach((p) => {
    const rel = path.relative(PROJECT_ROOT, p)
    console.log(`  - ${rel}`)
  })
  if (pages.length > 10) {
    console.log(`  ... 还有 ${pages.length - 10} 个页面`)
  }
  console.log('')

  // 自动继续（脚本模式）
  log.info('开始迁移...\n')

  // 3. 批量迁移
  let successCount = 0
  let failedCount = 0
  let skippedCount = 0

  for (const page of pages) {
    const result = await migratePage(page)
    if (result === true) {
      successCount++
    } else if (result === false) {
      skippedCount++
    } else {
      failedCount++
    }
  }

  // 4. 总结
  console.log('\n📊 迁移完成！')
  console.log(`  ✅ 成功：${successCount} 个`)
  console.log(`  ⏭️  跳过：${skippedCount} 个`)
  console.log(`  ❌ 失败：${failedCount} 个`)
  console.log('')

  // 5. 下一步提示
  log.info('下一步操作：')
  console.log('  1. 检查迁移结果：git status')
  console.log('  2. 测试所有页面：pnpm dev')
  console.log('  3. 删除旧文件（确认无误后）')
  console.log('  4. 提交：git add -A && git commit -m "feat: migrate pages to app/[locale]"')
  console.log('')
}

main().catch((error) => {
  log.error('迁移过程出错！')
  console.error(error)
  process.exit(1)
})
