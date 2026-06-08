FROM loadimpact/k6:0.34.1
COPY src src
WORKDIR src
CMD ["run", "--out", "influxdb=http://influxdb:8086/smarthomedb", "test/smartplugswitch.js.js"]
