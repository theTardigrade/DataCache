const gulp = require("gulp"),
	path = require("path");

const plugins = ((keys) => {
        var obj = {};
        for (let i = 0, l = keys.length; i < l; ++i) {
            obj[keys[i]] = require(["gulp", keys[i]].join("-"));
        }
        return obj;
    })([
		"babel",
		"optimize-js",
		"rename",
		"strip-comments",
		"uglify",
    ]);

gulp.task("script", () => {

    let getSrc = () => {
			return gulp.src(path.join(__dirname, "src", "DataCache.js"))
				.pipe(plugins.babel({
    	    		"plugins": [
                		"arrow-functions",
                		"block-scoping"
            		].map((s) => ["transform", "es2015", s].join("-"))
        		}));
		};

	getSrc()
		.pipe(plugins.uglify())
		.pipe(plugins["optimize-js"]())
		.pipe(plugins.rename("DataCache.min.js"))
        .pipe(gulp.dest(path.join(__dirname, "build")));

	getSrc()
		.pipe(plugins["strip-comments"]())
		.pipe(plugins["optimize-js"]())
		.pipe(gulp.dest(path.join(__dirname, "build")));

});

gulp.task("default", [ "script" ]);
