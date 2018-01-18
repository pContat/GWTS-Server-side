#Developpement docker file

FROM node:latest
RUN mkdir /app
RUN npm install nodemon -g

WORKDIR /app
COPY ./app /app
ADD package.json /app/package.json

RUN npm install
EXPOSE 3030
EXPOSE 5858

CMD ["node", "--inspect=5858","bin/www"]

# CMD npm start
