FROM public.ecr.aws/lambda/nodejs:20
COPY lambda/ ./
CMD ["handler.handler"]

