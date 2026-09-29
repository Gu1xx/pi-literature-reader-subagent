---
description: 委派隔离的 literature-reader 子智能体阅读本地文献
---

调用 `subagent` 工具，参数使用：

- `agent`: `literature-reader`
- `agentScope`: `project`
- `task`: 将下面的请求原样作为完整任务传给子智能体

请求：$@

等待子智能体完成后，把它的结果直接返回给用户；不要用主智能体补写没有证据支持的内容。
