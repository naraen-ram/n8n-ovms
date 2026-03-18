FROM n8nio/n8n:latest

USER root

COPY n8n-nodes-ovms /home/node/n8n-nodes-ovms

RUN cd /home/node/n8n-nodes-ovms && \
    npm pack && \
    cd /usr/local/lib/node_modules/n8n && \
    npm install --no-save /home/node/n8n-nodes-ovms/*.tgz || true

USER node