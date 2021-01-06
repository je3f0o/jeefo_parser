/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : ast_node_definition.js
* Created at  : 2019-01-26
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

const for_each      = require("@jeefo/utils/object/for_each");
const Readonly      = require("@jeefo/utils/object/readonly");
const capitalize    = require("@jeefo/utils/string/capitalize");
const extend_member = require("@jeefo/utils/class/extend_member");
const I_AST_Node    = require("./i_ast_node");

class AST_Node_Definition {
	/**
     * @param symbol_definition {Object} - Symbol definition
	 */
	constructor (ast_node_definition) {
        if (typeof ast_node_definition.id !== "string") {
            throw new Error("Invalid argument: ast_node_definition.id");
        }
        if (typeof ast_node_definition.type !== "string") {
            throw new Error("Invalid argument: ast_node_definition.type");
        }
        if (typeof ast_node_definition.precedence !== "number") {
            throw new Error("Invalid argument: ast_node_definition.precedence");
        }
        if (typeof ast_node_definition.is !== "function") {
            throw new Error("Invalid argument: ast_node_definition.is");
        }
        if (typeof ast_node_definition.initialize !== "function") {
            throw new Error("Invalid argument: ast_node_definition.initialize");
        }

        const class_name = ast_node_definition.id.split(' ').map(word => {
            return capitalize(word);
        }).join('');

        // jshint evil:true
        const Node = (new Function("I_AST_Node", `
            function ${class_name} () {
                I_AST_Node.call(this);
                this._id         = "${ast_node_definition.id}";
                this._type       = "${ast_node_definition.type}";
                this._precedence = ${ast_node_definition.precedence};
            }
            ${class_name}.prototype = Object.create(I_AST_Node.prototype);

            return ${class_name};
        `))(I_AST_Node);
        // jshint evil:false

        const proto_readonly    = new Readonly(Node.prototype);
        const instance_readonly = new Readonly(this);
        for_each(ast_node_definition, (key, value) => {
            switch (key) {
                case "id" :
                case "type" :
                case "precedence" :
                    proto_readonly.prop(key, value, false);
                    instance_readonly.prop(key, value);
                    break;
                case "protos" : break;
                default:
                    this[key] = value;
            }
        });

        if (ast_node_definition.protos) {
            for_each(ast_node_definition.protos, (key, value) => {
                extend_member(Node, key, value);
            });
        }

        instance_readonly.prop("Node", Node, false);
	}

	generate_new_node (parser) {
		const node = new this.Node();
		this.initialize(node, parser.next_token, parser);

		return node;
	}

    clone () {
        const protos     = {};
        const definition = { protos };

        Object.getOwnPropertyNames(this).forEach(prop => {
            switch (prop) {
                case "Node"        :
                case "constructor" :
                    break;
                default:
                    definition[prop] = this[prop];
            }
        });

        const { prototype } = this.Node;
        Object.getOwnPropertyNames(prototype).forEach(prop => {
            switch (prop) {
                case "id"          :
                case "type"        :
                case "precedence"  :
                case "constructor" :
                    break;
                default:
                    protos[prop] = prototype[prop];
            }
        });

        return new AST_Node_Definition(definition);
    }
}

module.exports = AST_Node_Definition;
