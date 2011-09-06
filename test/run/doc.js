var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port, config.conn.ssl),
	db = server.db(config.name("db")),
	doc_id = config.name("doc"),
	doc_api = db.doc(doc_id),
	doc_revs = [],
	_ = require("underscore");

module.exports = {
	setUp: function (test) {
		server.debug(config.log_level);
		if (!config.conn.party) {
			server.setUser(config.conn.name, config.conn.password);
		}
		db.create(function (err, response) {
			test.ifError(err);
			if (response) {
				test.ok(response.ok);
			}

			var ddoc = db.ddoc("test");
			ddoc.show("test", function (doc, req) {
				return { body: doc._id };
			});
			ddoc.save(function () {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
		});
	},

	suite: {
		"API Test": {
			"Save": function (test) {
				doc_api.body.hello = "world";
				doc_api.save(function (err, response) {
					test.ifError(err);
					if (response) {
						doc_revs.push(response.rev);
						test.ok(response.ok);
					}
					test.done();
				});
			},
			"Get/Read": function (test) {
				doc_api.get(function (err, doc) {
					test.ifError(err);
					if (doc) {
						test.equal(doc.hello, "world");
					}
					test.done();
				});
			},
			"Show": function (test) {
				doc_api.show("test/test", function (err, response) {
					test.ifError(err);
					if (response) {
						test.equals(response, doc_id);
					}
					test.done();
				});
			},
			"Prop": function (test) {
				var ret = doc_api.prop("foo", "bar");
				test.strictEqual(doc_api, ret);

				test.equal(doc_api.body.foo, "bar");
				test.equal(doc_api.body.foo, doc_api.prop("foo"));

				test.done();
			},
			"Delete": function (test) {
				doc_api.del(function (err, response) {
					test.ifError(err);
					if (response) {
						doc_revs.push(response.rev);
						test.ok(response.ok);
					}
					test.done();
				});
			}
			/* I keep getting "function_clause" errors trying to use _purge, CouchDB bug perhaps?
			"DB Purge": function (test) {
				var docs = {};
				docs[doc_id] = doc_revs;

				doc_api.db.purge(docs, function (err, response) {
					console.log(docs, err, response);
					test.ifError(err);
					if (response) {
						test.ok(response.ok);
					}
					test.done();
				});
			}
			*/
		},
		"Init Test": {
			"No ID and no Body Defined": function (test) {
				var doc = db.doc();

				test.equal(doc.id,       null);
				test.equal(doc.body._id, null);
				test.done();
			},
			"String ID Only": function (test) {
				var doc_id = config.name("doc"),
					doc = db.doc(doc_id);

				test.equal(doc_id, doc.id);
				test.equal(doc_id, doc.body._id);
				test.done();
			},
			"Body with _id Defined": function (test) {
				var doc_id = config.name("doc"),
					doc = db.doc({ _id: doc_id });

				test.equal(doc_id, doc.id);
				test.equal(doc_id, doc.body._id);
				test.done();
			},
			"Body with no _id": function (test) {
				var doc = db.doc({ foo: "bar" });

				test.equal(doc.id,       null);
				test.equal(doc.body._id, null);
				test.equal(doc.body.foo, "bar");
				test.done();
			}
		}
	},

	tearDown: function (test) {
		db.drop(function (err, response) {
			test.ifError(err);
			if (response) {
				test.ok(response.ok);
			}
			test.done();
		});
	}
};