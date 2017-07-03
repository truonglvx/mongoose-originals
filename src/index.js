const { isEqual, pick } = require("lodash/fp");

function mongooseOriginals(schema, userOptions) {
    var options = Object.assign({ methods: true }, userOptions);

    if (!options.fields) {
        throw new Error("No fields specified for mongoose originals on schema");
    }

    function isChanged() {
        return !this.original || !isEqual(this.original, pick(options.fields, this.toObject()));
    }

    function saveOriginalNamed() {
        this.original = {};
        const newValues = this.toObject();

        options.fields.forEach(name => {
            this.original[name] = newValues[name];
        });
    }

    function initOriginals() {
        if (this.original === undefined) {
            saveOriginalNamed.bind(this)();
        }
    }

    schema.method("initOriginals", initOriginals);
    schema.method("isChanged", isChanged);
    schema.post("init", saveOriginalNamed);
    schema.post("save", saveOriginalNamed);

    if (options.methods) {
        schema.methods.collectionAdded = function collectionAdded(name) {
            var _this = this;

            return this[name].filter(function(item) {
                return !_this.original[name].find(function(originalItem) {
                    return item._id.equals(originalItem._id);
                });
            });
        };

        schema.methods.collectionRemoved = function collectionRemoved(name) {
            var _this = this;

            return this.original[name].filter(function(originalItem) {
                return !_this[name].find(function(item) {
                    return item._id.equals(originalItem._id);
                });
            });
        };

        schema.methods.collectionUpdated = function collectionUpdated(name) {
            var _this = this;

            return this[name].filter(function(item) {
                return _this.original[name].find(function(originalItem) {
                    return item._id.equals(originalItem._id);
                });
            });
        };
    }
}

module.exports = mongooseOriginals;
