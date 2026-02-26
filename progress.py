#!/usr/bin/env python3
"""
进度查看工具
============

独立运行，查看当前项目的功能完成进度。

用法：
    python progress.py                          # 查看当前目录
    python progress.py --project-dir ./my_app   # 查看指定目录
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


def count_tests(project_dir: Path) -> dict:
    tests_file = project_dir / "feature_list.json"

    if not tests_file.exists():
        return {"exists": False}

    try:
        with open(tests_file, "r", encoding="utf-8") as f:
            tests = json.load(f)

        total = len(tests)
        passing = sum(1 for t in tests if t.get("passes", False))
        failing = total - passing

        by_category = {}
        for t in tests:
            cat = t.get("category", "unknown")
            if cat not in by_category:
                by_category[cat] = {"total": 0, "passing": 0}
            by_category[cat]["total"] += 1
            if t.get("passes", False):
                by_category[cat]["passing"] += 1

        next_features = [
            t["description"]
            for t in tests
            if not t.get("passes", False)
        ][:5]

        return {
            "exists": True,
            "total": total,
            "passing": passing,
            "failing": failing,
            "percentage": (passing / total * 100) if total > 0 else 0,
            "by_category": by_category,
            "next_features": next_features,
        }
    except (json.JSONDecodeError, IOError) as e:
        return {"exists": False, "error": str(e)}


def get_git_info(project_dir: Path) -> str:
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", "-5"],
            cwd=project_dir,
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
        return "(no git history)"
    except Exception:
        return "(git not available)"


def read_progress_notes(project_dir: Path) -> str:
    progress_file = project_dir / "claude-progress.txt"
    if progress_file.exists():
        try:
            content = progress_file.read_text(encoding="utf-8")
            lines = content.strip().split("\n")
            return "\n".join(lines[-10:]) if len(lines) > 10 else content.strip()
        except IOError:
            return "(read error)"
    return "(not yet created)"


def main():
    parser = argparse.ArgumentParser(description="查看自主编码项目的功能完成进度")
    parser.add_argument(
        "--project-dir",
        type=Path,
        default=Path("."),
        help="项目目录路径 (default: current directory)",
    )
    args = parser.parse_args()

    project_dir = args.project_dir.resolve()

    print()
    print("=" * 60)
    print("  AUTONOMOUS CODING - 进度报告")
    print("=" * 60)
    print(f"\n  项目目录: {project_dir}")

    stats = count_tests(project_dir)

    if not stats.get("exists"):
        error = stats.get("error", "")
        if error:
            print(f"\n  feature_list.json 读取失败: {error}")
        else:
            print("\n  feature_list.json 尚未创建")
            print("  请先运行初始化 Agent (见 prompts/initializer_prompt.md)")
        print()
        return

    print()
    print("-" * 60)
    print("  总体进度")
    print("-" * 60)

    bar_width = 30
    filled = int(bar_width * stats["percentage"] / 100)
    bar = "█" * filled + "░" * (bar_width - filled)
    print(f"\n  [{bar}] {stats['percentage']:.1f}%")
    print(f"  通过: {stats['passing']}  |  未通过: {stats['failing']}  |  总计: {stats['total']}")

    print()
    print("-" * 60)
    print("  分类统计")
    print("-" * 60)
    for cat, info in stats["by_category"].items():
        pct = (info["passing"] / info["total"] * 100) if info["total"] > 0 else 0
        print(f"  {cat:15s}  {info['passing']:3d}/{info['total']:3d}  ({pct:.0f}%)")

    if stats["next_features"]:
        print()
        print("-" * 60)
        print("  接下来要做的功能 (前5个)")
        print("-" * 60)
        for i, desc in enumerate(stats["next_features"], 1):
            print(f"  {i}. {desc}")

    print()
    print("-" * 60)
    print("  最近 Git 提交")
    print("-" * 60)
    print(f"  {get_git_info(project_dir)}")

    print()
    print("-" * 60)
    print("  最近进度记录")
    print("-" * 60)
    print(f"  {read_progress_notes(project_dir)}")

    print()
    print("=" * 60)

    if stats["failing"] == 0:
        print("  所有功能已完成！项目构建完毕。")
    else:
        print("  下一步: 在 Cursor Agent 中粘贴 prompts/coding_prompt.md 继续开发")

    print("=" * 60)
    print()


if __name__ == "__main__":
    main()
