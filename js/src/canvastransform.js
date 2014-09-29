/**
 * [description]
 * deps: [hammer.js]
 */
;(function (ctx,Hammer,undefined) {
	/**
	 * @param canvas 		目标画布
	 * @param ctrl: Dom 	手势控制触控层
	 * @param image: Dom   	图片(Image or <img>)
	 * 
	 * 配置参数说明
	 * @ width: Number   	canvas 宽度 (可选)
	 * @ height: Number 	canvas 高度 (可选)
	 * @ min_scale:Number   图片最小比例 (def:1)
	 * @ drag: Boolean 		是否支持拖拽 (def:true)
	 * @ pinch: Boolean     是否支持缩放 (def:true)
	 * @ rotate: Boolean    是否支持旋转 (def:false)
	 * @ rect:Boolean 		是否在拖动时限制图片不留白 (def:true)
	 */
	function CanvasTransform (canvas,ctrl,image,opts) {
		this.opts = {
			width:canvas.width,
			height:canvas.height,
			min_scale:1,
			drag:true,
			rect:true,
			pinch:true,
			rotate:false
		}
		for(var i in opts){
			this.opts[i] = opts[i];
		}
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.img = image;
        this.ctrl = ctrl;
        var that = this;
        Hammer.defaults.behavior.touchAction = 'pan-y';
    	this.width = canvas.width = this.opts.width;
    	this.height= canvas.height = this.opts.height;
    	this.imgw = this.img.width;
    	this.imgh = this.img.height;
        this.init();
    }
    CanvasTransform.prototype = {
    	x:0,
    	y:0,
    	isdrag :false,
    	istransform :false,
        scale:1,
        rotation:0,
        canDrag:false,
        canPinch:false,
        canRotate:false,
        fitRect:true,
        getData :function(type){
        	type = type || 'image/png';
        	with(this){
        		return canvas.toDataURL(type,1);
        	}
        },
        // public: 将画布清除
        clear:function(){
        	this.ctx.clearRect(0, 0,  this.canvas.width, this.canvas.height);
        },
        // public: 更新一张图片进来
        setImage:function (image) {
    		this.img = image;
        	this.isdrag = false;
        	this.istransform = false;
        	this.scale = 1;
        	this.rotation = 0;
        	this.deltaX = 0;
        	this.deltaY = 0;
        	this.last_scale = 1;
        	this.last_rotation = 0;
        	this.startX = -(this.img.width-this.canvas.width)>>1;
        	this.startY = -(this.img.height-this.canvas.height)>>1;
        	this.centerX = this.startX;
        	this.centerY = this.startY;
        	this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        	this.redrawImage(this.img.width/2,this.img.height/2);
        },
        init:function(){
        	var that = this;
        	this.canDrag = this.opts.drag;
        	this.canPinch = this.opts.pinch;
        	this.canRotate = this.opts.rotate;
        	this.fitRect = this.opts.rect;
        	if(this.canPinch==true || this.canRotate==true){
        		this.fitRect = false
        	}
        	this.hammer = Hammer(this.ctrl, {
	        	swipe:false,
	        	hold:false,
	        	preventDefault:true
	        });
    		this.deltaX = 0;
        	this.deltaY = 0;
        	this.last_scale = 1;
        	this.last_rotation = 0;
        	this.startX = -(this.img.width-this.canvas.width)>>1;
        	this.startY = -(this.img.height-this.canvas.height)>>1;
        	this.centerX = this.startX;
        	this.centerY = this.startY;
        	this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        	this.redrawImage(this.img.width/2,this.img.height/2);
        	this.hammer.on('dragstart dragend transformstart transformend',function(ev){
				switch(ev.type) {
					case 'dragstart':
					    that.ctx.clearRect(0, 0, that.canvas.width, that.canvas.height);
					    break;
					case 'dragend':
					    if( that.isdrag && !that.istransform){
		        			that.startX += that.deltaX;
							that.startY += that.deltaY;
							that.deltaX = that.deltaY = 0;
							that.isdrag = false;
		        		}
					    break;
					case 'transformstart':
						that.istransform = true;
						break;
					case 'transformend':
						that.deltaX = that.deltaY = 0;
		        		that.last_scale = that.scale;
						that.last_rotation = that.rotation;	
						setTimeout(function(){that.istransform = false;},100);
						break;
				}
        	})
	        this.hammer.on('drag transform',function (ev) {
        		that.isdrag = true;
				switch(ev.type) {
					case 'drag':
					    if(!that.istransform) {
					    	if(that.canDrag){
					    		that.deltaX = ev.gesture.deltaX;
					    		that.deltaY = ev.gesture.deltaY;
					    	}
					    }
					    break;
					case 'transform':
						that.deltaX = 0;
						that.deltaY = 0;
						that.centerX = ev.gesture.center.pageX;
						that.centerY = ev.gesture.center.pageY;
						if(that.canRotate) that.rotation = that.last_rotation + ev.gesture.rotation;
						if(that.canPinch) that.scale = that.last_scale * ev.gesture.scale;
						break;
				}
				that.redrawImage.call(that);
	        });
        },
        redrawImage : function () {
        	this.ctx.clearRect(0, 0,  this.width, this.height);
        	this.scale = Math.max(this.opts.min_scale,this.scale)
			var offx = this.width*(1-this.scale)>>1;
			var offy = this.height*(1-this.scale)>>1;
			var cx = this.centerX/this.scale;
			var cy = this.centerY/this.scale;
			this.ctx.save();
			this.x = (this.startX + this.deltaX + offx );
			this.y = (this.startY + this.deltaY + offy );
			if(this.fitRect){
				if(this.imgw>this.width||this.imgh>this.height){
					var _x = Math.abs(this.imgw-this.width);
					var _y = Math.abs(this.imgh-this.height);
					if(this.x>0){
						this.x = 0;
					}else{
						this.x = Math.abs(this.x)>_x? _x*-1 :this.x;
					}
					if(this.y>0){
						this.y = 0;
					}else{
						this.y = Math.abs(this.y)>_y? _y*-1 :this.y;
					}
					
				}
			}
			this.ctx.translate(this.x , this.y);
			this.ctx.translate(cx,cy);
			this.ctx.scale(this.scale,this.scale);
			this.ctx.rotate(this.rotation* Math.PI / 180);
			this.ctx.translate(-cx,-cy);
			this.ctx.drawImage(this.img,0,0,this.img.width,this.img.height);
			this.ctx.restore();
        }
    }
    ctx.CanvasTransform = CanvasTransform;
}(window,Hammer))