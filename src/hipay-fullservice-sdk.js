/**
 * HiPay Fullservice library to tokenize credit cards
 */
var HiPay = {
	allowedParameters: {
		'card_number':true, 
		'card_holder':true, 
		'card_expiry_month':true, 
		'card_expiry_year':true,
		'cvc':true, 
		'multi_use':true,
		'generate_request_id':true
	},
	target: 'production',
	username: '',
	publicKey: '',

	isCardNumberValid: function (value) {
		  // accept only digits, dashes or spaces
		if (/[^0-9-\s]+/.test(value)) return false;

		// The Luhn Algorithm. It's so pretty.
		var nCheck = 0, nDigit = 0, bEven = false;
		value = value.replace(/\D/g, "");

		for (var n = value.length - 1; n >= 0; n--) {
			var cDigit = value.charAt(n),
				  nDigit = parseInt(cDigit, 10);

			if (bEven) {
				if ((nDigit *= 2) > 9) nDigit -= 9;
			}

			nCheck += nDigit;
			bEven = !bEven;
		}

		return (nCheck % 10) == 0;
	},
	
	isValid: function (params) {
		var errors = {'code':0, 'message':''};
		var unallowedParams = [];
		for (key in params) {
			if (this.allowedParameters[key] != true) {
				unallowedParams.push(key);
			}
		}
		
		if (unallowedParams.length > 0) {
			
			errors.code = 408;
			var message = 'unallowed parameters: {'
			for (key in unallowedParams) {
				console.log(unallowedParams[key]);
				message += unallowedParams[key] + ' ';
			}
			message += '}';
			message += ' allowed parameters are: {';
				
			for (key in this.allowedParameters) {
				message += key;
				message += ' ';
			}
			message += '}';
			
			errors.message = message;
		}
		
		if ( ! this.isCardNumberValid(params['card_number']) ) {
			errors.code = 409;
			errors.message = 'cardNumber is invalid : luhn check failed';
		}
		
		return errors;
	},
	
	setTarget: function(target) { 
	    this.target = target; 
    },

    getTarget: function() { 
        return this.target; 
    },
    
    setCredentials: function(username, publicKey) {
        this.username = username;
        this.publicKey = publicKey;
    },
    
    create: function(params, fn_success, fn_failure) {
    	if(params['card_expiry_month'].length < 2) {
	    	params['card_expiry_month'] = '0' + params['card_expiry_month'];
    	}
    	if(params['card_expiry_year'].length == 2) {
	    	params['card_expiry_year'] = '20' + params['card_expiry_year'];
    	}
    	errors = this.isValid(params);
		if ( errors.code != 0 ) {
    		fn_failure(errors);
    	} else {
    	
	        var endpoint = 'https://secure2-vault.hipay-tpp.com/rest/v2/token/create.json';
	        if (this.getTarget() == 'test' || this.getTarget() == 'stage' ) {
	            endpoint = 'https://stage-secure2-vault.hipay-tpp.com/rest/v2/token/create.json';
	        } else if (this.getTarget() == 'dev') {
	            endpoint = 'http://dev-secure2-vault.hipay-tpp.com/rest/v2/token/create.json';
	        }
	        
	        if (!("generate_request_id" in params)) {
        		params['generate_request_id'] = 0;
	        }
	        
	        reqwest({
	            url: endpoint,
			    crossOrigin: true,
			    method: 'post',
			    headers: {
	                'Authorization': 'Basic ' + window.btoa(this.username + ':' + this.publicKey)
	            },
			    data: params,
			    success: function(resp) {
			    	
			    	if( typeof resp['code'] != 'undefined' )  {
			    		fn_failure({ code: resp['code'], message: resp['message'] });
			    	}  else {
			    		fn_success(resp);
			    	}
		        },
			    error: function (err) {
			    	obj = JSON.parse(err['response']);
		            fn_failure({ code: obj['code'], message: obj['message'] });
		        }
	        });
    	}
    }
};