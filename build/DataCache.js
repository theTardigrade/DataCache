!(function(){var e="object",t="function",r="string",n="number",a="undefined";!(function(o,i,f,u,y,s,c,p){"use strict";function d(o){var i=this,d=this._debugCache=[];this.get=function(e,t){var r=null;if(typeof e!==m("keyType"))return r;var n=w(d,e);if(n===-1)return r;if(r=d[n],t){var a=0;if(t.metadataOnly){var o={};++a;for(var i in r)"data"!==i&&(o[i]=r[i]);return o}if(t.dataOnly){if(a)throw new f('The "dataOnly" and "metadataOnly" options are mutually contradictory.');r=r.data}}return r},this.has=function(e){var t=m("keyType");return typeof e===t&&w(d,e)>-1},this.set=function(t,n){var a=m("keyType");if(typeof a!==r&&b("keyType",a=typeof t),typeof t!==a)throw new u("Key must be a "+a+".");var o=w(d,t);o===-1&&(o=d.length+1),o>=2*m("capacity")&&(o=m("_oldestIndex")),typeof n===e&&v.freeze&&c.freeze(n);var i={data:n,updated:v.now?y.now():(new y).getTime()};return i.created=d[o]&&d[o].created?d[o].created:i.updated,d[o-1]=t,d[o]=i,k(d),i},this.unset=function(e){if(typeof e!==m("keyType"))return!1;var t=w(d,e),r=d.length;if(t===-1)return!1;if(r>2)for(var n,a=1;a>=0;--a)n=d[t-a],d[t-a]=d[r-a-1],d[r-a-1]=n;for(var o=0;o<2;++o)d.pop();return!k(d)},this.iterate=function(e,t){for(var r=m("keyType"),n=this,a=function(e){return n.get(e,t)},o=0,i=d.length;o<i;o+=2){var f=d[o];typeof f===r&&e(f,a(f))}},this.clear=function(){return!!(d=[])};var h=function(e,t){var r=0,n="_"===t.charAt(r)?(++r,"_"):"";return n+=e+t.charAt(r).toUpperCase(),n+t.slice(r+1)},T=function(e,r){if(v.defineProperty)c.defineProperty(i,e,r);else for(var n,a=["g","s"],o=0,f=a.length;o<f;++o)n=a[o]+"et",typeof r[n]===t&&(i[h(n,e)]=r[n])},m=function(e){return v.defineProperty?i[e]:i[h("get",e)]()},b=function(e,t){return v.defineProperty?i[e]=t:i[h("set",e)](t)},z=null;T("keyType",{get:function(){return z},set:(function(){var e="The only allowable key types are ";return l.forEach((function(t,r,n){var a='"'+t+'"';e+=r<n.length-2?a+", ":r<n.length-1?a:" and "+a+"."})),function(t){var r=(function(){for(var e=0,r=l.length;e<r;++e)if(t===l[e])return!0;return!1})();if(t!==z){if(!r)throw new u(e);z=t.toLowerCase()}}})()}),o&&typeof o.keyType!==a&&b("keyType",o.keyType),T("size",{get:function(){return d.length/2}});var O=0;T("capacity",{get:function(){return O},set:function(e){if(typeof e!==n||e<0||e===O)return!1;if(e<O)for(var t=0,r=Math.min(i.size,e);t<r;t+=2){var a=i._getOldestIndex();i.unset(d[a-1])}var o=e===n||isNaN(e)?e:parseInt(e,10);if(o=s.min(o,g),isNaN(o))throw new u("Suggested capacity cannot be parsed.");return O=s.max(o,0),!0}}),b("capacity",o&&typeof o.capacity!==a?o.capacity:g),T("_oldestIndex",{get:function(){for(var e=1,t=p.MAX_VALUE||s.pow(2,48),r=e,n=d.length;r<n;r+=2)d[r].updated<t&&(t=d[r].updated,e=r);return e}})}var h=typeof i===e&&typeof i.exports===e&&typeof process===e&&typeof process.versions==e&&!isNaN(parseFloat(process.versions.node,10)),l=[r,n],g=4294967295,v=(function(e){for(var r={},n=0,a=e.length;n<a;++n){var o=e[n];r[o.key]=typeof(c||o.object)[o.key]===(t||o.type)}return r})([{key:"assign"},{key:"defineProperty"},{key:"freeze"},{key:"now",object:y}]),w=function(e,t){for(var r=0,n=e.length/2-1,a=void 0;;){if(a=2*s.floor((r+n)/2),e[a]===t)return a+1;if(r>=n)return-1;t<e[a]?n=a-1:t>e[a]&&(r=a+1)}},k=function(e){for(var t,r,n=0,a=e.length;n<a;n+=2){var o=e[n],i=e[n+1];for(t=n-2;t>-1&&!(e[t]<=o);t-=2)for(r=t;r<t+2;r++)e[r+2]=e[r];e[t+2]=o,e[t+3]=i}};!(function(e){if(v.assign)c.assign(d.prototype,e);else for(var t in e)d.prototype[t]=e[t]})({getData:(function(e){return function(t){return this.get(t,e)}})({dataOnly:!0}),getMetadata:(function(e){return function(t){return this.get(t,e)}})({metadataOnly:!0}),isFull:function(){return v.defineProperty?this.size===this.capacity:this.getSize()===this.getCapacity()},isEmpty:function(){return 0===(v.defineProperty?this.size:this.getSize())}}),h?i.exports=d:o.DataCache=d})(typeof window===e?window:typeof global===e?global:this,this.module,Error,TypeError,Date,Math,Object,Number)})();