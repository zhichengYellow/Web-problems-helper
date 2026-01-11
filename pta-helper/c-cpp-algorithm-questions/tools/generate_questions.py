#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量生成题库的辅助脚本
- 支持从 CSV / Markdown 导入为统一 JSON 结构
- 若系统安装 pandas/openpyxl，可从 Excel(xlsx) 导入
- 用法示例：
  1) 从 CSV:
     python tools/generate_questions.py import --src data.csv --out c-cpp-algorithm-questions/data-structures/array.json --category array --title "数组题库"
  2) 从 Markdown:
     python tools/generate_questions.py import --src questions.md --out c-cpp-algorithm-questions/algorithms/sorting.json --category sorting --title "排序题库"
  3) 从 Excel(可选，需 pandas):
     python tools/generate_questions.py import --src data.xlsx --sheet Sheet1 --out c-cpp-algorithm-questions/algorithms/searching.json --category searching --title "查找题库"

CSV/Excel 字段建议：
id,title,description,difficulty,tags,input_format,output_format,examples,constraints,solution_outline

Markdown 简单格式建议（多题用 --- 分隔）：
# id: array_001
title: 两数之和
difficulty: easy
tags: array, hash
input_format: 数组+目标值
output_format: 索引对
description: ...
examples:
- input: [2,7,11,15], target=9
  output: [0,1]
constraints: ...
solution_outline: ...
---
# id: array_002
...

生成器会将 tags 按逗号/空格分割为数组；examples 支持 JSON/键值行。
"""

import argparse
import json
import os
import sys
import csv
from datetime import datetime

def _read_csv(path):
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    return rows

def _read_excel(path, sheet=None):
    try:
        import pandas as pd  # 可选依赖
    except Exception:
        print("未安装 pandas，无法读取 Excel。请改用 CSV 或安装 pandas/openpyxl。", file=sys.stderr)
        return []
    df = pd.read_excel(path, sheet_name=sheet) if sheet else pd.read_excel(path)
    return df.to_dict(orient="records")

def _parse_md_blocks(text):
    # 简单 Markdown 解析器：按 '---' 分块，逐块读取键值对与 examples
    blocks = []
    for raw in text.split("\n---"):
        block = {}
        lines = [l.strip() for l in raw.strip().splitlines() if l.strip()]
        if not lines:
            continue
        examples = []
        i = 0
        while i < len(lines):
            line = lines[i]
            if line.lower().startswith("# id:"):
                block["id"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("title:"):
                block["title"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("difficulty:"):
                block["difficulty"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("tags:"):
                block["tags"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("input_format:"):
                block["input_format"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("output_format:"):
                block["output_format"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("description:"):
                block["description"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("constraints:"):
                block["constraints"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("solution_outline:"):
                block["solution_outline"] = line.split(":", 1)[1].strip()
            elif line.lower().startswith("examples:"):
                # 读取后续以 '- ' 开头的示例行
                i += 1
                while i < len(lines) and lines[i].startswith("- "):
                    ex = lines[i][2:].strip()
                    # 尝试按 'input: ..., output: ...' 拆分
                    if "input:" in ex and "output:" in ex:
                        parts = ex.split("output:")
                        input_part = parts[0].replace("input:", "").strip()
                        output_part = parts[1].strip()
                        examples.append({"input": input_part, "output": output_part})
                    else:
                        examples.append({"text": ex})
                    i += 1
                continue  # 避免多加一次 i
            i += 1
        if examples:
            block["examples"] = examples
        blocks.append(block)
    return blocks

def _normalize_row(row):
    def split_tags(val):
        if not val:
            return []
        return [t.strip() for t in val.replace(",", " ").split() if t.strip()]

    q = {
        "id": row.get("id") or row.get("ID") or "",
        "title": row.get("title") or row.get("Title") or "",
        "description": row.get("description") or row.get("Description") or "",
        "difficulty": (row.get("difficulty") or "medium").lower(),
        "tags": split_tags(row.get("tags") or row.get("Tags")),
        "io": {
            "input_format": row.get("input_format") or row.get("Input") or "",
            "output_format": row.get("output_format") or row.get("Output") or ""
        },
        "examples": None,
        "constraints": row.get("constraints") or "",
        "solution_outline": row.get("solution_outline") or ""
    }
    # examples 解析
    ex = row.get("examples") or row.get("Examples")
    if isinstance(ex, str) and ex.strip():
        try:
            q["examples"] = json.loads(ex)
        except Exception:
            # 尝试按行解析 'input:..., output:...'
            arr = []
            for line in ex.splitlines():
                line = line.strip()
                if not line:
                    continue
                if "input:" in line and "output:" in line:
                    parts = line.split("output:")
                    input_part = parts[0].replace("input:", "").strip()
                    output_part = parts[1].strip()
                    arr.append({"input": input_part, "output": output_part})
                else:
                    arr.append({"text": line})
            q["examples"] = arr
    return q

def import_file(src, out_path, category, title=None, sheet=None):
    ext = os.path.splitext(src)[1].lower()
    if ext in [".csv"]:
        rows = _read_csv(src)
    elif ext in [".xlsx", ".xls"]:
        rows = _read_excel(src, sheet=sheet)
    elif ext in [".md", ".markdown"]:
        with open(src, "r", encoding="utf-8") as f:
            text = f.read()
        rows = _parse_md_blocks(text)
    else:
        print(f"不支持的输入格式: {ext}", file=sys.stderr)
        return 1

    questions = [_normalize_row(r) for r in rows if r]
    data = {
        "meta": {
            "category": category,
            "title": title or f"{category} 题库",
            "version": "1.0.0",
            "updated_at": datetime.now().strftime("%Y-%m-%d"),
            "language": "zh-CN"
        },
        "questions": questions
    }
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"已生成: {out_path}，共 {len(questions)} 题")
    return 0

def main():
    parser = argparse.ArgumentParser(description="结构化题库批量生成工具")
    sub = parser.add_subparsers(dest="cmd")

    p_import = sub.add_parser("import", help="从 CSV/Markdown/Excel 导入为 JSON")
    p_import.add_argument("--src", required=True, help="源文件路径（csv/md/xlsx）")
    p_import.add_argument("--out", required=True, help="输出 JSON 路径")
    p_import.add_argument("--category", required=True, help="分类键，如 array、tree")
    p_import.add_argument("--title", required=False, help="题库标题")
    p_import.add_argument("--sheet", required=False, help="Excel 工作表名")

    args = parser.parse_args()
    if args.cmd == "import":
        sys.exit(import_file(args.src, args.out, args.category, args.title, args.sheet))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()