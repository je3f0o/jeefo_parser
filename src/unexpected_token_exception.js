/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : unexpected_token_exception.js
* Created at  : 2019-02-09
* Updated at  : 2020-10-22
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

const style = require("@jeefo/command/misc/style");

const DEFAULT_COLOR    = "gray";
const FIRST_LINE_REGEX = /^.+[^\n]\n/;

const align_pairs = (max_key_length, pairs) => {
    return pairs.map(pair => {
        return {
            pair           : pair,
            length         : `${ pair.key }${ ' '.repeat(max_key_length - pair.key.length) } : ${ pair.value }`.length,
            max_key_length : max_key_length,
        };
    });
};

const align_table = groups => {
    const aligned_groups = groups.map(group => {
        const max_key_length = group.info.reduce((max, pair) => {
            return Math.max(max, pair.key.length);
        }, 0);

        return {
            title        : group.title,
            aligned_rows : align_pairs(max_key_length, group.info)
        };
    }, 0);

    const max_line_length = aligned_groups.reduce((max, group) => {
        const max_row_length = group.aligned_rows.reduce((max, row) => {
            return Math.max(max, row.length);
        }, 0);

        return Math.max(max, group.title.length, max_row_length);
    }, 0);

    return aligned_groups.map(group => {
        const title  = group.title ? `[${ group.title }] ` : '';
        const header = `+ ${ title }${ '-'.repeat(max_line_length - title.length) } +`;
        const lines = [style(header, "cyan")];

        const border = style('|', "cyan");
        group.aligned_rows.forEach(row => {
            const pair = row.pair;

            const colored_key = `${ style(pair.key  , pair.key_color   || DEFAULT_COLOR) }${
                ' '.repeat(row.max_key_length - pair.key.length)
            }`;
            const colored_value = `${ pair.value_style ? pair.value_style(pair.value) : style(pair.value, DEFAULT_COLOR) }${
                ' '.repeat(max_line_length - row.length)
            }`;

            lines.push(`${ border } ${ colored_key } : ${ colored_value } ${ border }`);
        });

        return lines.join('\n');
    }).join('\n');
};

class UnexpectedTokenException extends SyntaxError {
    constructor (parser, error_message) {
        super(error_message || "Unexpected token");
		this.token = parser.next_token;

        const error_line = parser.tokenizer.streamer.string.
            split('\n')[parser.next_token.start.line - 1].
            replace(/\t/g, ' '.repeat(parser.tokenizer.tab_size));

        const spaces_length = this.token.start.virtual_column - 1;
        let hat_length = this.token.end.virtual_column - this.token.start.virtual_column + 1;
        if (hat_length < 0) hat_length = 1;
        const spaces   = ' '.repeat(spaces_length);
        const pointers = '^'.repeat(hat_length);

        const table = [
            {
                title : "Error information",
                info  : [
                    {
                        key         : "Type",
                        value       : "SyntaxError",
                        value_style : value => style(value, "red")
                    },
                    {
                        key   : "Message",
                        value : this.message
                    },
                    {
                        key   : "Instanceof",
                        value : `[Class: ${ this.constructor.name }]`,
                        value_style : () => [
                            style("[Class: ", "gray"),
                            style(this.constructor.name, "magenta"),
                            style("]", "gray"),
                        ].join('')
                    },
                    {
                        key   : "Description",
                        value : "Language grammar said it's not correct syntax."
                    }
                ]
            },
            {
                title : "Token information",
                info  : [
                    {
                        key   : "Line number",
                        value : this.token.start.line
                    },
                    {
                        key   : "Column number",
                        value : this.token.start.column
                    },
                    {
                        key   : "Virtual column number",
                        value : this.token.start.virtual_column
                    },
                    {
                        key   : "Index",
                        value : this.token.start.index
                    },
                ]
            },
            {
                title : "Source",
                info  : [
                    {
                        key   : `Error line:${ this.token.start.line }`,
                        value : error_line,
                        value_style : value => style(value, "gray")
                    },
                    {
                        key         : "Pointer",
                        value       : `${ spaces }${ pointers }`,
                        value_style : value => style(value, "red")
                    },
                ]
            },
            {
                title : '',
                info  : []
            }
        ];

		this.stack = [
            align_table(table),
			`${ style("Stack trace", "red")  } =>\n${ this.stack.replace(FIRST_LINE_REGEX, '') }`,
		].join("\n");
    }
}

UnexpectedTokenException.prototype.description = "Language grammar said it is not correct syntax.";

module.exports = UnexpectedTokenException;
