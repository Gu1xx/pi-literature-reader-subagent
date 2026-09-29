# Literature Reader 子智能体

使用方式：重启 pi 后输入：

```text
/read-literature 阅读 D:\Courses\材料智能设计实验\智能体\你的论文.pdf，总结核心结论、实验条件与局限，并标注页码
```

也可以让主智能体直接调用 `subagent` 工具：

```json
{
  "agent": "literature-reader",
  "agentScope": "project",
  "task": "阅读指定论文并整理核心结论、实验条件、数据证据与局限"
}
```

## 六层隔离

| 隔离层 | 实现 |
|---|---|
| 进程 | 每次任务通过 `spawn` 启动一个独立 pi 进程 |
| 上下文 | 子进程只收到 `Task: ...`，不传入主智能体消息历史 |
| 提示词 | agent 正文通过 `--system-prompt` 替换基础提示词，同时禁用 AGENTS/CLAUDE 上下文发现 |
| 工具 | 只启用 `read`、`grep`、`find`、`ls` 和只读的 `extract_pdf`，没有 shell、写入或编辑工具 |
| skill | 先用 `--no-skills` 关闭自动发现，再用 `--skill` 只加载 `literature-reading` |
| 存储 | 会话只写入本目录的 `sessions/`，不进入主智能体会话目录 |

子进程的工作目录固定为上层“智能体”文件夹，只能由只读工具访问其中的课程资料。它还会关闭自动扩展、提示词模板和主题发现，只显式加载本目录的 PDF 只读工具；该工具在每轮调用前再次清除环境中的附加提示词和上下文文件。
