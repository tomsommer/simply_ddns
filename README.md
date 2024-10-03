# Simply DDNS

This is a simple application you can use to update your DNS records at simply.com dynamically.
When it runs it will check if your domain has changed since the last time it ran and then update it if it has changed.

It uses the [simply.com](https://www.simply.com/en/docs/api/) DDNS API to update the records.

## Configuration
Inside the config folder, copy config.example.json and name it config.json. Replace account and `apikey` with your account id and API Key which you can find in the administration section in your simply.com control panel.

Then add your records and domains that you want to dynamically update. Each domain is added as a key with a list of records for that domain that is should update.

Example
```json
"domains": {
    "example.com": [
        "foo.example.com",
        "bar.example.com"
    ]
}
```
## Run it using Node
After you have created your [config.json](##Configuration) and have node 18 install you can run the app directly using npm, `npm run app`.

## Run it using Docker or Podman
You have to create your [config.json](##Configuration) in a folder that you mount as a volume in the container, *called config in this example.*

>**Docker**<br>
`docker run -v "$PWD/config:/app/config" chrisode/simply_ddns:latest`

>**Podman**<br>
`podman run -v "$PWD/config:/app/config" chrisode/simply_ddns:latest`

### Using docker-compose
```yaml
version: "3"
services:
  app:
    image: "chrisode/simply_ddns"
    volumes:
      - "./config:/app/config"
```

# LIcense
BSD 2-Clause License

Copyright (c) 2020, Christoffer Söderberg
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
