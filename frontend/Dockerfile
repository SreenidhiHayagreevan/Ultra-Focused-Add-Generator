FROM python:3.11-slim

WORKDIR /site
COPY . .

EXPOSE 10001

CMD ["sh", "-c", "if [ -n \"$API_BASE\" ]; then escaped=$(printf '%s' \"$API_BASE\" | sed 's/[&|]/\\\\&/g'); sed -i \"s|REPLACE_ME|$escaped|g\" /site/config.js; fi; python -m http.server ${PORT:-10001} --bind 0.0.0.0"]
