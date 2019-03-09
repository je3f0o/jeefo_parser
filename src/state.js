/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : state.js
* Created at  : 2019-03-09
* Updated at  : 2019-03-09
* Author      : jeefo
* Purpose     :
* Description :
* Reference   :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

module.exports = class State {
    constructor () {
        this.values  = Object.create(null);
        this.default = null;
    }

    add (name, value, is_default) {
        if (this.values[name] !== undefined) {
            throw new Error(`Duplicated state name: '${ name }'`);
        }
        if (typeof value !== "number") {
            throw new Error("State value is not a number");
        }
        Object.keys(this.values).forEach(key => {
            if (this.values[key] === value) {
                throw new Error(`Duplicated state value: '${ value }'`);
            }
        });

        this.values[name] = value;
        if (is_default) {
            this.default = value;
        }
    }

    get_value (state_name) {
        if (this.values[state_name] === undefined) {
            throw new Error("Unregistered state name");
        }
        return this.values[state_name];
    }
};
