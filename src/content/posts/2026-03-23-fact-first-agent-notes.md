---
title: "Why A Fact-First Agent Notes System Matters"
summary: "A learning system for AI Infra and agent engineering should treat evidence as a first-class artifact, not decoration."
publishedAt: 2026-03-23
updatedAt: 2026-03-23
status: published
tags:
  - ai-infra
  - agent
  - knowledge-system
category: essay
truthStandard: "Only publish claims that can be traced to primary sources or clearly attributed evidence; speculation must be labeled."
thesis: "In fast-moving domains like AI Infra and agent engineering, trust compounds faster than output volume. A fact-first workflow is a strategic advantage."
sources:
  - title: "Software Engineering at Google - Chapter on Knowledge Sharing"
    publisher: "O'Reilly / Google"
    url: "https://abseil.io/resources/swe-book/html/ch03.html"
    accessedAt: "2026-03-23"
    note: "Used for the knowledge-compounding principle."
  - title: "Documentation System Design"
    publisher: "Write the Docs"
    url: "https://www.writethedocs.org/guide/docs-as-code/"
    accessedAt: "2026-03-23"
    note: "Used for docs-as-code maintenance practice."
facts:
  - claim: "Treating notes as versioned artifacts makes updates, reviews, and rollbacks manageable."
    evidence: "Docs-as-code workflows explicitly rely on version control, peer review, and automation to manage documentation quality."
    source: "https://www.writethedocs.org/guide/docs-as-code/"
    confidence: "high"
    boundary: "This supports process quality; it does not guarantee factual correctness without source review."
  - claim: "Knowledge sharing quality affects engineering leverage over time."
    evidence: "Google's SWE book frames documentation and shared knowledge as leverage that compounds team effectiveness."
    source: "https://abseil.io/resources/swe-book/html/ch03.html"
    confidence: "high"
    boundary: "The source discusses engineering organizations broadly, not AI Infra specifically."
---

一个人的学习系统，最怕两种错：

1. 看得很多，最后只剩情绪。
2. 写得很好，但底层事实是错的。

对 AI Infra 和 agent 这种高速变化的方向，第二种更危险。因为错误一旦写得像真的，之后所有判断都会建立在假地基上。

## 真正该积累的，不是“文章数量”

你真正要积累的是三层资产：

- **Evidence**：原始来源、访问时间、上下文说明。
- **Claims**：你从来源里提出了哪些可检验的断言。
- **Judgment**：这些断言拼起来，支持了什么结论；哪些条件变化后结论会失效。

这也是为什么博客不能只是一个展示层。它必须把来源和事实链显式暴露出来。

## 为什么用 GitHub 维护

因为 GitHub 解决的是知识维护问题，不只是托管问题：

- 每次修改都有版本记录。
- 任何结论变化都能看到 diff。
- 以后如果你需要把一篇文章改成专题、课程或付费内容，原始材料不会丢。

## 一个现实原则

写作时默认把每篇文章拆成两个问题：

1. **什么是事实？**
2. **我基于这些事实做了什么判断？**

只要这两个问题分不清，就先别发。
