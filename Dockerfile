FROM python:3

WORKDIR /usr/src/app

COPY . .
RUN pip install --no-cache-dir -r ./espmv/requirements.txt

CMD ["bash", "./espmv/run.sh"]
