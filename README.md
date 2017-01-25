# Outbound Rate Limits

[![Greenkeeper badge](https://badges.greenkeeper.io/haraka/haraka-plugin-outbound-rate-limit.svg)](https://greenkeeper.io/)

This plugin for Haraka implements outbound rate limits using redis
as the shared store.

# Installation

`npm install --save https://github.com/haraka/haraka-plugin-outbound-rate-limit.git`

Then add `outbound-rate-limit` to your config/plugins, and create the configuration file for your domains.

# Configuration

Configuration is set in your `config/outbound_rate_limit.ini` file.

The defaults are:

```
delay=30
redis_host=127.0.0.1:6379

[limits]
;example.com=10
```

The counts for the limits are the maximum concurrency for a given outbound domain.

The `delay` value are the number of seconds to delay before trying to send this mail again. The concurrency will be checked on every attempt to deliver the mail.
