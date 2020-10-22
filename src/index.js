/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2019-01-23
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

const JeefoTokenizer           = require("@jeefo/tokenizer");
const assign                   = require("@jeefo/utils/object/assign");
const for_each                 = require("@jeefo/utils/object/for_each");
const State                    = require("./state");
const I_AST_Node               = require("./i_ast_node");
const AST_Node_Table           = require("./ast_node_table");
const AST_Node_Definition      = require("./ast_node_definition");
const UnexpectedTokenException = require("./unexpected_token_exception");

const TERMINATOR_PRECEDENCE  = 0;
const object_define_property = Object.defineProperty;

class JeefoParser {
    static get JeefoTokenizer      () { return JeefoTokenizer;      }
    static get I_AST_Node          () { return I_AST_Node;          }
    static get AST_Node_Table      () { return AST_Node_Table;      }
    static get AST_Node_Definition () { return AST_Node_Definition; }

    static get UnexpectedTokenException () {
        return UnexpectedTokenException;
    }

    /**
     * @Validators
     * @param: language (String)
     * @param: tokenizer (JeefoTokenizer)
     * @param: ast_node_table (AST_Node_Table)
     */
    constructor (language, tokenizer, ast_node_table) {
        if (typeof language !== "string") {
            throw new TypeError("Invalid argument: language");
        }
        if (! (tokenizer instanceof JeefoTokenizer)) {
            throw new TypeError("Invalid argument: tokenizer");
        }
        if (! (ast_node_table instanceof AST_Node_Table)) {
            throw new TypeError("Invalid argument: ast_node_table");
        }

        this.language       = language;
        this.tokenizer      = tokenizer;
        this.ast_node_table = ast_node_table;

        this.is_terminated        = true;
        this.prepare_next_node    = true;
        this.prev_node            = null;
        this.prev_token           = null;
        this.previous_nodes       = null;
        this.previous_tokens      = null;
        this.next_token           = null;
        this.next_node_definition = null;

        this.state         = new State();
        this.suffixes      = [];
        this.context_stack = [];
        this.current_state = this.state.default;

        let onpreparation = null;
        object_define_property(this, "onpreparation", {
            get () { return onpreparation; },
            set (value) {
                if (typeof value !== "function") {
                    throw new TypeError(
                        "Assigned onpreparation is not a function"
                    );
                }
                onpreparation = value;
            }
        });
    }

    look_ahead (throw_end_of_stream) {
        const {
            current_state,
            is_terminated,
            prev_node,
            previous_nodes,
            prev_token,
            previous_tokens,
            next_token,
            next_node_definition,
        } = this;

        this.tokenizer.streamer.cursor.save();
        this.is_terminated = false;

        // Taking account `onpreparation` event
        this.prepare_next_node_definition(throw_end_of_stream);
        const result_next_token = this.next_token;

        this.tokenizer.streamer.cursor.rollback();
        this.is_terminated        = is_terminated;
        this.current_state        = current_state;
        this.prev_node            = prev_node;
        this.previous_nodes       = previous_nodes;
        this.prev_token           = prev_token;
        this.previous_tokens      = previous_tokens;
        this.next_token           = next_token;
        this.next_node_definition = next_node_definition;

        return result_next_token;
    }

    prepare_next_node_definition (throw_end_of_stream) {
        if (this.next_token) {
            this.previous_tokens.push(this.prev_token = this.next_token);
        }
        this.next_token = this.tokenizer.get_next_token();

        if (this.next_token) {
            // Only dev mode
            if (this.next_token) {
                this.next_token.id       = this.next_token.id;
                this.next_token.priority = this.next_token.priority;
            }
            // Only dev mode

            this.next_node_definition = this.ast_node_table.find(
                this.next_token, this
            );

            if (this.onpreparation) {
                this.onpreparation(this);

                if (this.is_terminated || ! this.next_token) {
                    this.next_node_definition = null;
                }
            }
        } else if (throw_end_of_stream) {
            this.throw_unexpected_end_of_stream();
        } else {
            this.is_terminated        = true;
            this.next_node_definition = null;
        }
    }

    prepare_next_state (state_name, throw_end_of_stream) {
        this.prev_node            = null;
        this.prev_token           = null;
        this.previous_nodes       = [];
        this.previous_tokens      = [];
        this.is_terminated        = false;
        this.prepare_next_node    = true;
        this.next_node_definition = null;

        if (state_name) {
            this.current_state = this.state.get_value(state_name);
        } else {
            this.current_state = this.state.default;
        }
        this.prepare_next_node_definition(throw_end_of_stream);
    }

    generate_next_node () {
        if (! this.next_node_definition) {
            this.throw_unexpected_token("AST_Node_Definition is not found");
        }
        return this.next_node_definition.generate_new_node(this);
    }

    change_state (state_name, set_prev_state, find_new_node = true) {
        if (set_prev_state !== undefined) {
            console.log(set_prev_state);
            throw new Error("Deprecated");
        }
        if (set_prev_state) {
            this.prev_state = this.current_state;
        }
        this.current_state = this.state.get_value(state_name);
        if (find_new_node) {
            this.next_node_definition = this.ast_node_table.find(
                this.next_token, this
            );
        }
    }

    terminate (node) {
        if (node) this.end(node);
        this.is_terminated        = true;
        this.next_node_definition = null;
    }

    parse_next_node (left_precedence) {
        if (typeof left_precedence !== "number") {
            throw new Error("Invalid left precedence");
        }

        const {cursor} = this.tokenizer.streamer;
        while (! this.is_terminated) {
            const {next_node_definition} = this;
            if (! next_node_definition) this.throw_unexpected_token(
                "AST_Node_Definition is not found"
            );
            if (next_node_definition.precedence <= left_precedence) break;
            const node = this.generate_next_node();
            this.set_prev_node(node);

            // DEBUG_START
            if ([null, undefined].includes(this.current_state)) {
                this.throw_unexpected_token("Invalid current_state");
            }
            // DEBUG_END

            (
                ! this.is_terminated &&
                this.prepare_next_node &&
                node.end.index === cursor.position.index &&
                this.prepare_next_node_definition()
            );
        }

        return this.prev_node;
    }

    parse (script, tab_size) {
        const nodes        = [];
        this.context_stack = [];
        this.tokenizer.init(script, tab_size);

        this.prepare_next_state();
        while (this.next_token) {
            const node = this.parse_next_node(TERMINATOR_PRECEDENCE);
            if (node) {
                nodes.push(node);
            } else {
                this.throw_unexpected_token("AST_Node is not found.");
            }

            this.prepare_next_state();
        }

        return nodes;
    }

    is_next_node (id) {
        if (this.next_node_definition) {
            return this.next_node_definition.id === id;
        }
        return false;
    }

    set_prev_node (prev_node) {
        this.prev_node = prev_node;
        this.previous_nodes.push(prev_node);
    }

    get_state_name (state) {
        const { values } = this.state;

        return Object.keys(values).find(state_name => {
            return values[state_name] === state;
        });
    }

    get_state_value (state_name) {
        return this.state.get_value(state_name);
    }

    get_current_state_name () {
        return this.get_state_name(this.current_state);
    }

    end (node) {
        assign(this.tokenizer.streamer.cursor.position, node.end);
    }

    refine (state_name, input_node) {
        this.change_state(state_name);
        if (! this.next_node_definition) {
            this.throw_unexpected_token(
                `Unexpected state to refine: ${ state_name }`,
                input_node
            );
        }

        const Node = this.next_node_definition.Node;
        if (! this.next_node_definition.refine) {
            this.throw_unexpected_token(
                `refine method is not implemented in: ${
                    Node.prototype.constructor.name
                }`, input_node
            );
        }

        const node = new Node();
        this.next_node_definition.refine(node, input_node, this);
        return node;
    }

    is_reserved_word (value) {
        return this.ast_node_table.reserved_words[value] !== undefined;
    }

    expect (expectation, condition) {
        if (typeof condition === "function") condition = condition(this);
        if (! condition) {
            const {streamer} = this.tokenizer;
            this.throw_unexpected_token(
                `Expected ${expectation} instead saw: ${
                    streamer.substring_from_token(this.next_token)
                }`
            );
        }
    }

    to_string (node) {
        return this.tokenizer.streamer.substring_from_token(node);
    }

    throw_unexpected_token (error_message, token) {
        if (token) this.next_token = token;
        throw new UnexpectedTokenException(this, error_message);
    }

    throw_unexpected_refine (refining_node, error_node) {
        this.throw_unexpected_token(
            `Unexpected '${ error_node.constructor.name }' refine in: ${
                refining_node.constructor.name
            }`, error_node
        );
    }

    throw_unexpected_end_of_stream () {
        throw new SyntaxError("Unexpected end of stream");
    }

    log (node) {
        console.log(node);
        console.log(this.to_string(node));
    }

    clone (name) {
        name = name || this.name;
        const tokenizer      = new JeefoTokenizer();
        const ast_node_table = new AST_Node_Table();

        this.tokenizer.token_definitions.forEach(td => {
            tokenizer.register({
                id         : td.Token.prototype.id,
                priority   : td.Token.prototype.priority,
                is         : td.is,
                initialize : td.initialize,
            });
        });

        const { reserved_words, node_definitions } = this.ast_node_table;

        const defs = [];
        for_each(reserved_words, (word, node_def) => {
            const def = defs.find(d => d.node_def === node_def);

            if (def) {
                def.words.push(word);
            } else {
                defs.push({ words: [word], node_def });
            }
        });

        defs.forEach(def => {
            ast_node_table.register_reserved_words(def.words, def.node_def);
        });

        ast_node_table.node_definitions = node_definitions.map(d => d.clone());

        const clone  = new JeefoParser(name, tokenizer, ast_node_table);
        Object.assign(clone.state.values, this.state.values);
        clone.state.default = this.state.default;

        if (this.onpreparation) {
            clone.onpreparation = this.onpreparation;
        }

        return clone;
    }
}

module.exports = JeefoParser;
