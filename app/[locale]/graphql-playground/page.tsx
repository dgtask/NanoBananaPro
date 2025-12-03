'use client'

import { ApolloSandbox } from '@apollo/sandbox/react'
import { useState } from 'react'

/**
 * GraphQL Playground 页面
 * 艹！这个页面提供交互式 GraphQL 查询界面 + 示例查询 + 快速开始指南
 */
export default function GraphQLPlaygroundPage() {
  const [showExamples, setShowExamples] = useState(true)

  // 示例查询列表
  const exampleQueries = [
    {
      name: '获取当前用户',
      query: `query GetMe {
  me {
    id
    email
    userProfile {
      displayName
      avatarUrl
      bio
    }
  }
}`,
    },
    {
      name: '博客文章列表',
      query: `query GetBlogPosts {
  blogPosts(status: "published", limit: 5) {
    id
    title
    excerpt
    coverImageUrl
    publishedAt
    author {
      id
      userProfile {
        displayName
      }
    }
  }
}`,
    },
    {
      name: 'Relay分页查询',
      query: `query GetBlogPostsConnection {
  blogPostsConnection(
    first: 10
    orderBy: "created_at"
    orderDirection: "desc"
  ) {
    edges {
      cursor
      node {
        id
        title
        excerpt
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`,
    },
    {
      name: '测试查询',
      query: `query TestQuery {
  hello
  currentTime
}`,
    },
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部横幅 - 快速开始指南 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">
            🚀 GraphQL Playground
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-bold mb-2">1️⃣ 认证</div>
              <div className="text-white/80">
                登录后自动携带 Cookie，或在 Headers 中添加 Authorization: Bearer &lt;token&gt;
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-bold mb-2">2️⃣ 编写查询</div>
              <div className="text-white/80">
                在左侧编辑器中输入 GraphQL 查询，或使用右侧示例
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-bold mb-2">3️⃣ 执行</div>
              <div className="text-white/80">
                点击 ▶️ 按钮执行查询，查看右侧结果面板
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-bold mb-2">4️⃣ 文档</div>
              <div className="text-white/80">
                点击 Docs 查看完整 Schema 文档和类型定义
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主体内容区域 */}
      <div className="flex">
        {/* 左侧示例查询面板 */}
        {showExamples && (
          <div className="w-80 border-r border-border bg-muted/30 p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">📚 示例查询</h2>
              <button
                onClick={() => setShowExamples(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {exampleQueries.map((example, index) => (
                <div
                  key={index}
                  className="bg-background border border-border rounded-lg p-3"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-sm">
                      {example.name}
                    </div>
                    <button
                      onClick={() => copyToClipboard(example.query)}
                      className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                    >
                      复制
                    </button>
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {example.query}
                  </pre>
                </div>
              ))}
            </div>

            {/* 文档链接 */}
            <div className="mt-6 space-y-2">
              <h3 className="font-bold text-sm mb-2">📖 相关文档</h3>
              <a
                href="/docs/GRAPHQL_API.md"
                className="block text-sm text-blue-600 hover:underline"
              >
                → GraphQL API 完整文档
              </a>
              <a
                href="/api/graphql"
                className="block text-sm text-blue-600 hover:underline"
              >
                → GraphQL Endpoint
              </a>
            </div>

            {/* 注意事项 */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="font-bold text-sm text-yellow-800 mb-2">
                ⚠️ 注意事项
              </div>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• 生产环境禁用 Introspection</li>
                <li>• 查询复杂度最大 1000</li>
                <li>• 速率限制：FREE 100/分钟</li>
                <li>• 避免深度嵌套查询（最大深度 5）</li>
              </ul>
            </div>
          </div>
        )}

        {/* 右侧 Apollo Sandbox 主界面 */}
        <div className="flex-1 relative">
          {!showExamples && (
            <button
              onClick={() => setShowExamples(true)}
              className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm hover:bg-primary/90"
            >
              📚 显示示例
            </button>
          )}
          <div className="h-[calc(100vh-200px)]">
            <ApolloSandbox
              initialEndpoint="/api/graphql"
              includeCookies={true}
            />
          </div>
        </div>
      </div>

      {/* 底部性能提示 */}
      <div className="bg-muted border-t border-border p-4">
        <div className="max-w-7xl mx-auto text-sm text-muted-foreground">
          <div className="flex justify-between items-center">
            <div>
              💡 <strong>性能优化：</strong>
              使用 DataLoader（60%+ 性能提升）| Relay 游标分页 | 查询复杂度限制
            </div>
            <div className="text-xs">
              Powered by Pothos + GraphQL Yoga
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}