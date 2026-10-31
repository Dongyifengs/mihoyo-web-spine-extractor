import asyncio
import os
import queue
import subprocess
import sys
import threading
import tkinter as tk
import webbrowser
from pathlib import Path
from tkinter import filedialog, messagebox, ttk
from tkinter.scrolledtext import ScrolledText

from . import __version__
from .engine import run
from .models import Options

MODES = {"自动扫描 + 浏览器捕获": "auto", "仅静态扫描（速度快）": "static", "浏览器捕获 + 静态补全": "browser"}


class App:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.running = False
        self.events = queue.Queue()
        self.options = None
        self.last_result = None
        self.closing = False
        root.title(f"米哈游网页 Spine 提取器 · {__version__}")
        root.geometry("940x760")
        root.minsize(820, 720)
        root.configure(background="#eef2f6")
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TFrame", background="#eef2f6")
        style.configure("TLabel", background="#eef2f6", font=("Microsoft YaHei UI", 10))
        style.configure("TButton", font=("Microsoft YaHei UI", 10), padding=(12, 7))
        style.configure("TCheckbutton", background="#eef2f6", font=("Microsoft YaHei UI", 10))
        style.configure("Title.TLabel", font=("Microsoft YaHei UI", 22, "bold"), foreground="#17364d")
        style.configure("Muted.TLabel", foreground="#577084")
        style.configure("Accent.TButton", foreground="white", background="#126f91", padding=(24, 10))
        outer = ttk.Frame(root, padding=24)
        outer.pack(fill="both", expand=True)
        ttk.Label(outer, text="网页里的 Spine，一次整理好", style="Title.TLabel").pack(anchor="w")
        ttk.Label(outer, text="活动地址 / 新闻文章 / RSS 订阅 → 骨骼、图集、贴图、区域图片与提取报告", style="Muted.TLabel").pack(anchor="w", pady=(4, 18))
        ttk.Label(outer, text="网页地址（每行一个）").pack(anchor="w")
        self.urls = ScrolledText(outer, height=4, wrap="word", font=("Consolas", 11), relief="flat", padx=10, pady=10)
        self.urls.pack(fill="x", pady=(6, 12))
        outrow = ttk.Frame(outer)
        outrow.pack(fill="x")
        ttk.Label(outrow, text="保存到").pack(side="left", padx=(0, 12))
        base = Path(sys.executable).parent if getattr(sys, "frozen", False) else Path.cwd()
        self.output = tk.StringVar(value=str(base / "downloads"))
        ttk.Entry(outrow, textvariable=self.output).pack(side="left", fill="x", expand=True)
        ttk.Button(outrow, text="选择目录", command=self.choose_folder).pack(side="left", padx=(8, 0))
        settings = ttk.Frame(outer)
        settings.pack(fill="x", pady=14)
        self.mode = tk.StringVar(value=next(iter(MODES)))
        ttk.Combobox(settings, textvariable=self.mode, values=list(MODES), state="readonly", width=29).grid(row=0, column=0, padx=(0, 18), sticky="w")
        ttk.Label(settings, text="捕获时长（秒）").grid(row=0, column=1)
        self.wait = tk.StringVar(value="12")
        ttk.Spinbox(settings, from_=0, to=1800, textvariable=self.wait, width=6).grid(row=0, column=2, padx=(8, 18))
        ttk.Label(settings, text="订阅处理数").grid(row=0, column=3)
        self.limit = tk.StringVar(value="3")
        ttk.Spinbox(settings, from_=1, to=500, textvariable=self.limit, width=5).grid(row=0, column=4, padx=8)
        self.headed, self.unpack = tk.BooleanVar(value=False), tk.BooleanVar(value=True)
        ttk.Checkbutton(settings, text="显示浏览器，手动进入活动场景", variable=self.headed).grid(row=1, column=0, columnspan=2, sticky="w", pady=(12, 0))
        ttk.Checkbutton(settings, text="拆分区域图片", variable=self.unpack).grid(row=1, column=2, columnspan=3, sticky="w", pady=(12, 0))
        proxyrow = ttk.Frame(outer)
        proxyrow.pack(fill="x", pady=(0, 12))
        ttk.Label(proxyrow, text="代理（选填）").pack(side="left", padx=(0, 8))
        self.proxy = tk.StringVar()
        ttk.Entry(proxyrow, textvariable=self.proxy, width=36).pack(side="left")
        ttk.Label(proxyrow, text="例如 http://127.0.0.1:7890", style="Muted.TLabel").pack(side="left", padx=10)
        buttons = ttk.Frame(outer)
        buttons.pack(fill="x")
        self.start_button = ttk.Button(buttons, text="开始提取", style="Accent.TButton", command=self.start)
        self.start_button.pack(side="left")
        self.stop_button = ttk.Button(buttons, text="停止", command=self.stop, state="disabled")
        self.stop_button.pack(side="left", padx=8)
        self.report_button = ttk.Button(buttons, text="查看报告", command=self.open_report, state="disabled")
        self.report_button.pack(side="right")
        ttk.Button(buttons, text="打开结果目录", command=self.open_output).pack(side="right", padx=8)
        self.progress = ttk.Progressbar(outer, mode="indeterminate")
        self.progress.pack(fill="x", pady=(16, 8))
        self.status = tk.StringVar(value="准备就绪 · 每次提取会创建新目录，保留已有结果")
        ttk.Label(outer, textvariable=self.status).pack(anchor="w", pady=(0, 8))
        ttk.Label(outer, text="未触发的远端场景可能尚未加载。缺少资源时，勾选显示浏览器并增加捕获时长。", style="Muted.TLabel").pack(side="bottom", anchor="w", pady=(10, 0))
        self.logs = ScrolledText(outer, height=8, state="disabled", font=("Microsoft YaHei UI", 9), relief="flat", padx=10, pady=8)
        self.logs.pack(fill="both", expand=True)
        root.protocol("WM_DELETE_WINDOW", self.close)
        root.after(100, self.poll)

    def choose_folder(self):
        path = filedialog.askdirectory(initialdir=self.output.get())
        if path:
            self.output.set(path)

    def start(self):
        urls = [u.strip() for u in self.urls.get("1.0", "end").splitlines() if u.strip()]
        if not urls:
            messagebox.showinfo("需要网页地址", "请先粘贴活动页、新闻页或订阅源地址。")
            return
        try:
            self.options = Options(output=Path(self.output.get()), mode=MODES[self.mode.get()], wait=float(self.wait.get()),
                                   feed_limit=int(self.limit.get()), headed=self.headed.get(), unpack=self.unpack.get(),
                                   proxy=self.proxy.get().strip() or None)
        except ValueError as exc:
            messagebox.showerror("设置有误", str(exc))
            return
        self.running = True
        self.last_result = None
        self.start_button.configure(state="disabled")
        self.stop_button.configure(state="normal")
        self.report_button.configure(state="disabled")
        self.progress.start(12)
        self.status.set("正在扫描资源…")
        self.logs.configure(state="normal")
        self.logs.delete("1.0", "end")
        self.logs.configure(state="disabled")

        def worker():
            try:
                result = asyncio.run(run(urls, self.options, lambda m: self.events.put(("log", m))))
                self.events.put(("done", result))
            except Exception as exc:
                self.events.put(("error", str(exc)))
        threading.Thread(target=worker, daemon=True).start()

    def stop(self):
        if self.options:
            self.options.cancel.set()
            self.status.set("正在停止，保留已完成的文件…")
            self.stop_button.configure(state="disabled")

    def poll(self):
        try:
            while True:
                kind, data = self.events.get_nowait()
                if kind == "log":
                    self.logs.configure(state="normal")
                    self.logs.insert("end", data + "\n")
                    self.logs.see("end")
                    self.logs.configure(state="disabled")
                else:
                    self.running = False
                    self.progress.stop()
                    self.start_button.configure(state="normal")
                    self.stop_button.configure(state="disabled")
                    if kind == "error":
                        self.status.set("处理失败：" + data)
                    else:
                        self.last_result = data
                        complete = sum(a["complete"] for a in data["activities"])
                        partial = sum(a["partial"] for a in data["activities"])
                        empty = sum(not a["skeletons"] for a in data["activities"])
                        self.status.set(f"{'已停止' if data['cancelled'] else '处理结束'} · {complete} 组完整 · {partial} 组待补齐 · {empty} 个无骨骼活动 · {len(data['errors'])} 个失败入口")
                        if data["activities"]:
                            self.report_button.configure(state="normal")
                    if self.closing:
                        self.root.destroy()
                        return
        except queue.Empty:
            pass
        self.root.after(100, self.poll)

    def open_report(self):
        if self.last_result and self.last_result["activities"]:
            webbrowser.open(Path(self.last_result["activities"][0]["report"]).as_uri())

    def open_output(self):
        path = Path(self.last_result["directory"] if self.last_result else self.output.get()).resolve()
        path.mkdir(parents=True, exist_ok=True)
        if sys.platform == "win32":
            os.startfile(path)
        elif sys.platform == "darwin":
            subprocess.Popen(["open", str(path)])
        else:
            subprocess.Popen(["xdg-open", str(path)])

    def close(self):
        if self.running:
            self.closing = True
            self.stop()
        else:
            self.root.destroy()


def main():
    root = tk.Tk()
    App(root)
    root.mainloop()
