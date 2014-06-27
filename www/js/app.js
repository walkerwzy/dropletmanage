var token = '',
	flag = null,
	toastflag = null,
	inited = false,
	exitFlag = false,
	show = function(msg,error){
		clearTimeout(flag);
		var m = $(".msg");
		if(msg == 'hide'){
			m.hide(); 
			return;
		};
		if(error){
			m.addClass('error').html(msg).show();
			flag = setTimeout(function(){m.hide();},speed0);
		}
		else{
			m.removeClass('error').html(msg).show();
			flag = setTimeout(function(){m.hide()},5000);
		}
	},
	toast = function(msg){
		clearTimeout(toastflag);
		var t = $('.toast').text(msg).css('margin-left',function(){return 0-$(this).width()/2;}).show();
		toastflag = setTimeout(function(){t.hide();},5000);
	}
	home = function(){
		$('.back').click();
	},
	act_button = function(status){
		var acts = $('.actions .type').addClass('off');
		if(status == 'off') $('.act-on').removeClass('off');
		else if(status == 'active') {
			$('.act-off').add($('.act-re')).add($('.act-cy')).removeClass('off');
		}
	},
	run = function(){
		var apis = new api();
		if(!inited){
			inited = true;
			$.ajaxSetup({
				headers:{
					"Authorization" : " Bearer " + token
				},
				error:function(xhr,status,err){
					show(err,true);
				}
			});

			var navi = $('.navi'),
				arrow = $('.back'),
				acts = $('.actions'),
				con = $('.console'),
				sections = $('.sections');
			con.height(function(){
				return $(window).height()-$('.header').height()-sections.height();
			});	
			navi.on('click','.item',function(){
				var m = $(this).data('meta');
				act_button(m.status);
				navi.hide();
				acts.data('id',m.id).show();
				arrow.show();
			});
			arrow.on('click',function(){
				acts.hide();
				arrow.removeData().hide();
				navi.show();
				exitFlag = false;
			});
			sections.on('click','.type',function(){
				var o = $(this);
				if(o.is('.off')) return;
				if(!confirm('confirm?')) return;
				var	id = acts.data('id'),
					intflag = null,
					speed = 2000,
					_check = function(actionid){
								con[0].scrollTop = con[0].scrollHeight;
								apis.action(id,actionid).then(function(d){
									if(d.action.status == 'completed') {
										clearInterval(intflag);
										apis.droplet(id).then(function(d){
											act_button(d.droplet.status);
										});
										log('done!');
									}
								});
							},
					check = function(actionid){
						return function(){_check(actionid);};
					};
				$('.type').addClass('off');
				if(o.is('.act-on')){
					var xhr = apis.power_on(id);
					xhr.then(function(d){
						intflag = setInterval(check(d.action.id),speed);
					});
				}else if (o.is('.act-off')){
					var xhr = apis.power_off(id);
					xhr.then(function(d){
						intflag = setInterval(check(d.action.id),speed);
					});
				}else if (o.is('.act-cy')){
					var xhr = apis.power_cycle(id);
					xhr.then(function(d){
						intflag = setInterval(check(d.action.id),speed);
					});
				}else if (o.is('.act-re')){
					var xhr = apis.reboot(id);
					xhr.then(function(d){
						intflag = setInterval(check(d.action.id),speed);
					});
				}
			})
		}
		apis.listdroplets();
	},
	log = function(msg){
		if(typeof msg === 'undefined' || msg == undefined) return;
		if(typeof msg === 'object') msg = JSON.stringify(msg);
		var c = $('.console');
		c.html(c.html()+'<p>'+new Date().toLocaleTimeString()+': '+msg+'</p>');
	},
	clearlog = function(){
		$('.console').empty();
	};

function api(){
	var self = this,
		client_id = '', // v1 use
		api_key = '', // v1 use
		url = 'https://api.digitalocean.com/v2/droplets/';	
	self.droplet = function(id){
		log('querying droplet info...')
		return $.get(url+id,function(d){
			show('hide');
			log(d);
		});
	}
	self.listdroplets = function(){
		show('querying list...')
		$.get(url,function(d){
			show('hide');
			var c = $(".navi").empty();
			$.each(d.droplets,function(i,m){
				var cls = 'item ' + m.status,
					obj = $("<div/>",{text:m.name,'class':cls}); 
				obj.data('meta',m);
				c.append(obj);
			});
		});
	},
	self.shutdown = function(id){
		clearlog();
		log('querying shutdown...');
		return $.post(url+id+'/actions',{type:'shutdown'},function(d){
			show('hide');
			log(d);
		})
	},
	self.reboot = function(id){
		clearlog()
		log('rebooting...');
		return $.post(url+id+'/actions',{type:'reboot'},function(d){
			show('hide');
			log(d);
		})
	},
	self.power_cycle = function(id){
		clearlog();
		log('querying power cycle...');
		return $.post(url+id+'/actions',{type:'power_cycle'},function(d){
			show('hide');
			log(d);
		});
	},
	self.power_off = function(id){
		clearlog();
		log('querying power off...');
		return $.post(url+id+'/actions',{type:'power_off'},function(d){
			show('hide');
			log(d);
		})
	},
	self.power_on = function(id){
		clearlog();
		log('querying power on...');
		return $.post(url+id+'/actions',{type:'power_on'},function(d){
			show('hide');
			log(d);
		})
	},
	self.action = function(dropletid, actionid){
		log('querying action status...');
		return $.get(url+dropletid+'/actions/'+actionid,{type:'power_on'},function(d){
			show('hide');
			log(d);
		})
	};
	return self;
}