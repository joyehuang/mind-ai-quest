# AI Xiao Dang Jia (ModelScope Studio Deployment)

This repository is configured for ModelScope Studio deployment with a minimal Gradio app entrypoint.

## Current Runtime

- Entry file: `app.py`
- Host: `0.0.0.0`
- Port: `7860`
- Container deploy config: `ms_deploy.json`
- Docker image build file: `Dockerfile`
- Python dependencies: `requirements.txt`

## Environment Variable

This app reads API key from environment variable:

- `xxx_KEY`

Example:

```bash
export xxx_KEY="your_api_key"
```

On Windows PowerShell:

```powershell
$env:xxx_KEY = "your_api_key"
```

## Local Run

Install dependencies:

```bash
pip install -r requirements.txt
```

Run:

```bash
python app.py
```

Then open `http://127.0.0.1:7860`.

## Deploy to ModelScope Studio

Required files already included:

- `app.py`
- `Dockerfile`
- `requirements.txt`
- `ms_deploy.json`

`ms_deploy.json` is set to:

```json
{
  "$schema": "https://modelscope.cn/api/v1/studios/deploy_schema.json",
  "sdk_type": "docker",
  "resource_configuration": "platform/2v-cpu-16g-mem",
  "port": 7860
}
```

## Common Issue

If startup fails with:

`ModuleNotFoundError: No module named 'requests'`

make sure `requirements.txt` contains:

- `requests>=2.31.0,<3.0.0`
