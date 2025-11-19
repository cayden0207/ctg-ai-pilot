import os
import google.generativeai as genai
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.markdown import Markdown

# --- 配置区域 ---
API_KEY = os.getenv("GEMINI_API_KEY")

# 模型名称 (2025 Nov 最新预览版)
MODEL_NAME = "gemini-3-pro-preview"

# Gemini 3 Pro 定价 (USD per 1M tokens, <= 200k context tier)
# 如果你的对话非常长(超过200k context), 价格应改为 Input 4.0 / Output 18.0
PRICE_INPUT_PER_1M = 2.00
PRICE_OUTPUT_PER_1M = 12.00
# ----------------

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel(MODEL_NAME)
chat = model.start_chat(history=[])
console = Console()

# 用于累计会话总费用
session_total_cost = 0.0

def calculate_cost(prompt_tok, cand_tok):
    input_cost = (prompt_tok / 1_000_000) * PRICE_INPUT_PER_1M
    output_cost = (cand_tok / 1_000_000) * PRICE_OUTPUT_PER_1M
    return input_cost + output_cost

def print_usage_panel(usage):
    global session_total_cost
    
    prompt_tokens = usage.prompt_token_count
    candidate_tokens = usage.candidates_token_count
    total_tokens = usage.total_token_count
    
    # 计算本轮费用
    current_cost = calculate_cost(prompt_tokens, candidate_tokens)
    # 累加到总费用
    session_total_cost += current_cost

    table = Table(title=f"📊 {MODEL_NAME} Usage & Cost", show_header=True, header_style="bold magenta")
    table.add_column("Metric", style="cyan")
    table.add_column("Current Turn", justify="right", style="green")
    table.add_column("Session Total", justify="right", style="yellow") # 新增：累计列

    table.add_row("Input Tokens", str(prompt_tokens), "-")
    table.add_row("Output Tokens", str(candidate_tokens), "-")
    table.add_row("Total Tokens", str(total_tokens), "-")
    # 显示费用 (保留6位小数)
    table.add_row("Est. Cost (USD)", f"${current_cost:.6f}", f"${session_total_cost:.6f}", style="bold")

    console.print(table)
    console.print(f"[dim italic]Pricing tier based on <=200k context: ${PRICE_INPUT_PER_1M}/M in, ${PRICE_OUTPUT_PER_1M}/M out[/dim italic]\n")

def main():
    console.print(Panel(f"[bold blue]Gemini 3 Pro CLI[/bold blue]\n[dim]Model: {MODEL_NAME}[/dim]\nType 'exit' to quit.", expand=False))
    
    while True:
        try:
            user_input = console.input("[bold white]You > [/bold white]")
            if user_input.lower() in ["exit", "quit"]:
                console.print(f"[bold yellow]Session ended. Total cost: ${session_total_cost:.6f}[/bold yellow]")
                break
            
            if not user_input.strip():
                continue

            with console.status("[bold green]Thinking..."):
                response = chat.send_message(user_input)
            
            console.print(Panel(Markdown(response.text), title="Gemini 3 Pro", border_style="blue"))
            
            if response.usage_metadata:
                print_usage_panel(response.usage_metadata)
                
        except Exception as e:
            console.print(f"[bold red]Error:[/bold red] {e}")

if __name__ == "__main__":
    main()