/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : i_jeefo_symbol.js
* Created at  : 2019-01-27
* Updated at  : 2019-01-30
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

const insert_at = require("jeefo_utils/array/insert_at");

const NEW_LINE_REGEXP = /\n/g;

module.exports = class IJeefoSymbol {
    constructor () {
        // jshint ignore:start
        if (new.target === IJeefoSymbol) {
            throw new Error("Interface class cannot be instantiated.");
        }
        // jshint ignore:end
    }

    to_string () {
        const properties = Object.keys(this);
        if (! properties.includes("id")) {
            properties.unshift("id");
        }
        if (! properties.includes("type")) {
            insert_at(properties, "type", 1);
        }
        if (! properties.includes("precedence")) {
            insert_at(properties, "precedence", 2);
        }

        let max_length = Math.max.apply(null, properties.map(property => property.length));
        let rows = properties.map(property => {
            let value = this[property];
            if (Array.isArray(value)) {
                value = `[${ value }]`;
                if (value.length > 80) {
                    value = value.split(',').join(",\n");
                }
            } else if (typeof value === "string") {
                value = value.replace(NEW_LINE_REGEXP, "\\n");
            }

            return `${ property }${ ' '.repeat(max_length - property.length) } : ${ value }`;
        });

        max_length = Math.max.apply(null, rows.map(row => row.split('\n')[0].length));
        rows = rows.map(row => `| ${ row }${ ' '.repeat(max_length - row.split('\n')[0].length) } |`);

        const dash_line = `+${ '-'.repeat(max_length + 2) }+`;
        rows.unshift(
            dash_line,
            `| JeefoSymbol${ ' '.repeat(max_length - "JeefoSymbol".length) } |`,
            dash_line
        );
        rows.push(dash_line);

        return rows.join('\n');
    }

    toString () {
        return `<JeefoSymbol[${ this.id }:${ this.precedence }]>`;
    }
};
