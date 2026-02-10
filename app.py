import os

import gradio as gr


API_KEY = os.getenv("xxx_KEY", "")


def modelscope_quickstart(name: str) -> str:
    user_name = (name or "").strip() or "Student"
    key_status = "env var xxx_KEY loaded" if API_KEY else "env var xxx_KEY is missing"
    return f"Welcome to AI Xiao Dang Jia, {user_name}! Status: {key_status}."


demo = gr.Interface(
    fn=modelscope_quickstart,
    inputs=gr.Textbox(label="Your name"),
    outputs=gr.Textbox(label="System message"),
    title="AI Xiao Dang Jia",
    description="Service runs on 0.0.0.0:7860",
)


if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
