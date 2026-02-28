FROM python:3.11-slim

WORKDIR /site
COPY . .

EXPOSE 10000

CMD ["sh", "-euc", "if [ -z \"${API_BASE:-}\" ] || [ \"${API_BASE}\" = \"REPLACE_ME\" ]; then echo 'ERROR: API_BASE env var is required and cannot be REPLACE_ME'; exit 1; fi; escaped=$(printf '%s' \"$API_BASE\" | sed 's/[&|]/\\\\&/g'); sed -i \"s|REPLACE_ME|$escaped|g\" /site/config.js; if grep -q 'REPLACE_ME' /site/config.js; then echo 'ERROR: API_BASE injection failed'; exit 1; fi; echo \"Frontend starting with API_BASE=$API_BASE\"; python -m http.server ${PORT:-10000} --bind 0.0.0.0"]
