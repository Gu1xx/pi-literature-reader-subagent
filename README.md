# Pi 文献阅读子智能体

这是一个运行在 [Pi Coding Agent](https://github.com/badlogic/pi-mono) 中的文献阅读子智能体。它面向本地 PDF、Markdown 和纯文本学术文献，提取研究问题、材料体系、实验条件、关键结果、证据位置、创新点、局限和可复现性信息。

项目同时包含《文献阅读子智能体构建实验报告》，记录环境、构建方法、使用方法、验证过程和六层隔离设计。

## 六层隔离

| 层级 | 实现方式 |
|---|---|
| 进程隔离 | 每次任务通过 `spawn` 启动独立 Pi 子进程 |
| 上下文隔离 | 子进程只接收当前 `Task`，不继承主会话历史 |
| 提示词隔离 | 使用 `--system-prompt` 替换系统提示词，并关闭上下文文件发现 |
| 工具隔离 | 白名单限定为 `read`、`grep`、`find`、`ls`、`extract_pdf` |
| Skill 隔离 | 关闭自动发现，只显式加载文献阅读 Skill |
| 存储隔离 | 子智能体会话写入独立目录，该目录不纳入版本控制 |

## 目录结构

```text
.
|-- pi-workspace/
|   `-- .pi/
|       |-- agents/literature-reader.md
|       |-- extensions/subagent/
|       |   |-- agents.ts
|       |   `-- index.ts
|       |-- prompts/read-literature.md
|       `-- subagents/literature-reader/
|           |-- skill/SKILL.md
|           |-- extract_pdf.py
|           |-- pdf-tool.ts
|           `-- README.md
|-- 启动pi.cmd
`-- 文献阅读子智能体构建实验报告.docx
```

## 环境要求

- Windows 10/11
- Node.js 22.19.0 或更高版本
- Pi Coding Agent
- Python 3.10 或更高版本
- Python 包 `pypdf`

已验证环境为 Node.js 26.7.0、Pi 0.87.1、Python 3.12.14 和 pypdf 6.10.0。

## 安装和使用

1. 克隆仓库并安装依赖：

   ```powershell
   pip install pypdf
   npm install -g @mariozechner/pi-coding-agent
   ```

2. 将待阅读论文放在仓库内自建的 `Papers/` 目录中。该目录已被 Git 忽略。

3. 双击 `启动pi.cmd`，或在终端运行：

   ```powershell
   Set-Location .\pi-workspace
   pi
   ```

4. 在 Pi 中调用提示词：

   ```text
   /read-literature 阅读 ../Papers/example.pdf，总结核心结论、实验条件与局限，并标注页码
   ```

主智能体也可以直接调用 `subagent` 工具：

```json
{
  "agent": "literature-reader",
  "agentScope": "project",
  "task": "阅读指定论文并整理核心结论、实验条件、数据证据与局限"
}
```

## 数据与凭据

仓库不包含论文原文、课程讲义、API 密钥、Pi 认证文件或历史会话。请在本机配置模型提供商，并避免提交 `auth.json`、`models.json`、`.env` 和 `sessions/`。报告中的软件版本和本地路径只用于记录实验环境。

## 实验报告

- [DOCX 版本](./文献阅读子智能体构建实验报告.docx)

## 许可说明

本仓库用于个人学习和实验留存。Pi Coding Agent 及第三方依赖分别遵循其原始许可证；论文、课程讲义和其他第三方材料不包含在本仓库中。
