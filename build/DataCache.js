!(function(){var e="object",t="function",r="string",n="number";!(function(o,a,f,i){function u(t){var a=(function(){var e=t?t.size:NaN,r=e===n||isNaN(e)?e:parseInt(e,10);return r=i.min(r,i.pow(2,32)-1),i.max(r,0)})(),u=this._debugCache=isNaN(a)?[]:new Array(a),s=r,d=(function(){var e="The only allowable key types are ";return p.forEach((function(t,r,n){var o='"'+t+'"';e+=r<n.length-2?o+", ":r<n.length-1?o:" and "+o+"."})),function(t){var r=p.some((function(e){return t===e}));if(!r)throw TypeError(e);s=t.toLowerCase()}})();t&&t.keyType&&d(t.keyType),this.get=function(e,t){y(e,s);var r=h(u,e);return r===-1?void 0:t?u[r].data:u[r]},this.set=function(t,r){s||d(typeof t),y(t,s);var n=h(u,t);n===-1&&(n=u.length+1),typeof r===e&&c.freeze&&o.Object.freeze(r);var a={data:r,updated:c.now?f.now():(new f).getTime()};return a.created=u[n]&&u[n].created?u[n].created:a.updated,u[n-1]=t,u[n]=a,v(u),a},this.unset=function(e){var t,r=h(u,e),n=u.length;if(r===-1)return!1;if(n>2)for(t=1,temp;t>=0;t--)temp=u[r-t],u[r-t]=u[n-t-1],u[n-t-1]=temp;for(t=0;t<2;t++)u.pop();return!v(u)},this.clear=function(){return!!(u=[])}}var s=typeof a===e&&typeof a.exports===e&&typeof process===e&&typeof process.versions==e&&!isNaN(parseFloat(process.versions.node,10)),p=[r,n],c={now:typeof f.now===t,freeze:typeof Object.freeze===t},y=function(e,t){if(typeof e!==t)throw new TypeError("Key must be a "+t+".")},h=function(e,t){for(var r,n=0,o=e.length/2-1;;){if(r=2*i.floor((n+o)/2),e[r]===t)return r+1;if(n>=o)return-1;t<e[r]?o=r-1:t>e[r]&&(n=r+1)}},v=function(e){for(var t,r,n,o,a=0,f=e.length;a<f;a+=2){for(t=e[a],r=e[a+1],n=a-2;n>-1&&!(e[n]<=t);n-=2)for(o=n;o<n+2;o++)e[o+2]=e[o];e[n+2]=t,e[n+3]=r}};!(function(e){for(var t in e)u.prototype[t]=e[t]})({getData:function(e){var t=this.get(e);return t?t.data:t},getMetadata:function(e){var t=this.get(e),r={};if(!t)return t;for(var n in t)"data"!==n&&(r[n]=t[n]);return r}}),s?a.exports=u:o.DataCache=u})(typeof window===e?window:typeof global===e?global:this,this.module,Date,Math)})();