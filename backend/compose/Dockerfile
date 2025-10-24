FROM python:3.11-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
  curl gnupg apt-transport-https ca-certificates \
  unixodbc unixodbc-dev gcc g++ \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/apt/keyrings && \
  curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/keyrings/microsoft.gpg && \
  chmod go+r /etc/apt/keyrings/microsoft.gpg && \
  echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" | tee /etc/apt/sources.list.d/microsoft-prod.list > /dev/null && \
  apt-get update && \
  ACCEPT_EULA=Y apt-get install -y msodbcsql18 && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY manage.py ./manage.py
CMD gunicorn app.wsgi:application --bind 0.0.0.0:8000
