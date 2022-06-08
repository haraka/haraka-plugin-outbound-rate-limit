"use strict";

const constants = require('haraka-constants');

exports.redis_host = '127.0.0.1:6379';
let redis_client;

exports.register = function () {
    const plugin = this;

    plugin.load_config();
    plugin.init_redis();

    plugin.register_hook('send_email', 'increment_limit');
    plugin.register_hook('delivered',  'decrement_limit');
    plugin.register_hook('deferred',   'decrement_limit');
    plugin.register_hook('bounce',     'decrement_limit');
}

exports.increment_limit = function (next, hmail) {
    const plugin = this;

    const rkey = `outbound-rate-limit:${  hmail.domain}`;
    redis_client.hincrby(rkey, 'TOTAL', 1);
    redis_client.hget(rkey, 'TOTAL', function (err, count) {
        if (err) {
            plugin.logerror(`Failed to get value from redis: ${  err}`);
            return next(); // just deliver
        }
        count = parseInt(count, 10);
        if (plugin.cfg.limits[hmail.domain]) {
            const limit = parseInt(plugin.cfg.limits[hmail.domain], 10);
            if (limit && count > limit) {
                return next(constants.delay, plugin.delay);
            }
        }
        return next();
    });
}

exports.decrement_limit = function (next, hmail) {

    const rkey = `outbound-rate-limit:${  hmail.domain}`;
    redis_client.hincrby(rkey, 'TOTAL', -1);
    return next();
}

exports.load_config = function () {
    const plugin = this;

    plugin.cfg = plugin.config.get('outbound_rate_limit.ini', {
        booleans: [],
    }, function () {
        plugin.load_config();
    });

    plugin.delay = plugin.cfg.main.delay || 30;

    if (plugin.cfg.main.redis_host &&
        plugin.cfg.main.redis_host !== plugin.redis_host) {
        plugin.redis_host = plugin.cfg.main.redis_host;
        plugin.loginfo(`set redis host to: ${  plugin.redis_host}`);
    }
};

exports.init_redis = function () {
    if (redis_client) { return; }

    const redis = require('redis');
    const host_port = this.redis_host.split(':');
    const host = host_port[0] || '127.0.0.1';
    const port = parseInt(host_port[1], 10) || 6379;

    redis_client = redis.createClient(port, host);
    redis_client.on('error', (err) => {
        this.logerror(`Redis error: ${  err}`);
        redis_client.quit();
        redis_client = null; // should force a reconnect
        // not sure if that's the right thing but better than nothing...
    });
};

exports.shutdown = function () {
    clearInterval(this._interval);
    if (redis_client) {
        redis_client.end();
    }
};
