/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : i_ast_node.js
* Created at  : 2019-01-27
* Updated at  : 2021-01-06
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

const insert_at = require("@jeefo/utils/array/insert_at");

const NEW_LINE_REGEXP = /\n/g;

function I_AST_Node () {
    if (new.target === I_AST_Node) {
        throw new Error("Interface class cannot be instantiated.");
    }
}

I_AST_Node.prototype.print = function () {
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
        `| AST_Node${ ' '.repeat(max_length - "AST_Node".length) } |`,
        dash_line
    );
    rows.push(dash_line);

    console.log(rows.join('\n'));
};

I_AST_Node.prototype.toString = function () {
    return `<${this.constructor.name}>`;
};

module.exports = I_AST_Node;
