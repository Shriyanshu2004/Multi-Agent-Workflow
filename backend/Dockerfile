FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Render provides PORT dynamically — expose it
EXPOSE $PORT

# Start server — main.py reads PORT from env (defaults to 8000)
CMD ["python", "main.py"]
