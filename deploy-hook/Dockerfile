FROM python:3.12-slim

WORKDIR /app

# Install docker CLI for compose commands
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://get.docker.com | sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

EXPOSE 9000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000"]
