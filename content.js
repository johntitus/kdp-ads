chrome.runtime.onMessage.addListener(
  function (message, sender, sendResponse) {
    if (message && message.message=='start') {
    	openPopup();
    }
    if (message && message.message=='loadData') {
    	cur_times = 0;
    	// load_data_ads();
    }
    if (message && message.changeURL) {
		$('.popads').remove();
		$('.popvalues').remove();
    }
  }
);

var topClicks;
var topOrders;

var productPagesClicks;
var productPagesOrders;

var restOfSearchClicks;
var restOfSearchOrders;

var topConversionRate;
var productPageConversionRate;
var restOfSearchConversionRate;

var cur_url = location.href;

var acosvalue = 30;
var ordervalue = 12.99;
var bidvalue = 1;

var max_times = 10;
var cur_times = 0;
var campaign_name = '';
var campaign_id = '';

var scale = '';
var topPlacement = 0;
var productPlacement = 0;
var bidMultiplier = 1;


// ===================================================
var s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);

// receive message from injected script
window.addEventListener('message', function (e) {
	href = location.href.split('/cm/sp/campaigns/');
	if (href.length < 2)
		return;
	href = href[1];
	campaign_id = href.split('/')[0];
	console.log(campaign_id)

  	data = e.data.data;

  	// Placements page
  	if (data && data.placements) {
	  	data.placements.forEach((a) => {
	  		if (a.bidAdjustmentPredicate == "PLACEMENT_GROUP_TOP") {
				topClicks = a.clicks;
				topOrders = a.orders;
			} else if (a.bidAdjustmentPredicate == "PLACEMENT_GROUP_DETAIL_PAGE") {
				productPagesClicks = a.clicks;
				productPagesOrders = a.orders;
			} else if (a.bidAdjustmentPredicate == "PLACEMENT_GROUP_OTHER") {
				restOfSearchClicks = a.clicks;
				restOfSearchOrders = a.orders;
			}
	  	})

	  	$('body h1').each(function() {
			if ($(this).attr('data-ccx-e2e-id') == 'aac-object-type') {
				campaign_name = $(this).find('span').text();
			}
		})
		funcStart();

		// === save data into localstorage ===
		s_data = {
			bidMultiplier: bidMultiplier
		};
  		chrome.storage.local.get('amazon_campaigns', function (bdata) {
			temp = {};
		    if (bdata.amazon_campaigns)
		    	temp = JSON.parse(bdata.amazon_campaigns);
			if (temp[campaign_id])
				temp[campaign_id]['bidMultiplier'] = bidMultiplier;
			else
				temp[campaign_id] = s_data;
			chrome.storage.local.set({
				'amazon_campaigns': JSON.stringify(temp)
			});
		})
	}

	// ads group targeting page
  	if (data && data.data) {
	  	chrome.storage.local.get('amazon_campaigns', function (bdata) {
			temp = {};
		    if (bdata.amazon_campaigns)
		    	temp = JSON.parse(bdata.amazon_campaigns);
			if (temp[campaign_id]) {
				bidvalue = temp[campaign_id]['bidMultiplier'] ? temp[campaign_id]['bidMultiplier'] : bidvalue;
				acosvalue = temp[campaign_id]['acosvalue'] ? temp[campaign_id]['acosvalue'] : acosvalue;
				ordervalue = temp[campaign_id]['ordervalue'] ? temp[campaign_id]['ordervalue'] : ordervalue;
			}
			data = data.data;
		  	calcSuggestedBid(data);

	  		strHtml = `
				<div class='popvalues'>
					<div class='popvalues_title'>Campaign:<span>`+campaign_name+`</span></div>
					<div class='popvalues_cont'>
						<div class='pop_input'>
							<div>Target ACoS (%)</div>
							<input type='number' id='acosvalue' value='`+acosvalue+`' />
						</div>
						<div class='pop_input'>
							<div>Order Value ($)</div>
							<input type='number' id='ordervalue' value='`+ordervalue+`' />
						</div>
						<div class='pop_input'>
							<div>Bid Multiplier</div>
							<input type='number' id='bidvalue' value='`+bidvalue+`' />
						</div>
						<div style='text-align:right;margin-top:20px;'>
							<div class='bt_value_update'>Update & Apply</div>
						</div>
					</div>
				</div>
			`;
			$('body').append(strHtml);

			$('.bt_value_update').unbind('click');
			$('.bt_value_update').click(function() {
				acosvalue = $('#acosvalue').val();
				ordervalue = $('#ordervalue').val();
				bidvalue = $('#bidvalue').val();
				calcSuggestedBid(data);
				s_data = {
					acosvalue: acosvalue,
					ordervalue: ordervalue,
					bidMultiplier: bidvalue
				};
				temp[campaign_id] = s_data;
				chrome.storage.local.set({
					'amazon_campaigns': JSON.stringify(temp)
				});
			})
	  	})
	}

});


// ================== functions ======================
function calcSuggestedBid(rdata) {
	rdata.forEach((a) => {
  		row = {
  			id: a.id,
  			acos: acosvalue/100, //a.acos,
  			clicks: a.clicks,
  			orders: a.orders,
  			sales: Math.round(a.sales.millicents / 1000) / 100,
  			optimistic_sales: ordervalue
  		};
  		suggested = 0;
  		if (row.sales) {
  			suggested = row.acos * (row.sales / row.clicks) * bidvalue;
  		} else {
  			suggested = row.acos * (row.optimistic_sales / (row.clicks + 1));
  		}
  		suggested = Math.round(suggested * 100) / 100;

		obj = $('.ReactVirtualized__Grid__innerScrollContainer');
		obj = obj.find('div[data-e2e-id="tableCell_cell_keywordBid"][data-udt-row-id="'+row.id+'"]');
		if (obj) {
			if (obj.find('.ads_pert').length == 0) {
				obj.append(`<div class='ads_pert'>Suggested: $`+(suggested)+`</div>`);
			} else {
				obj.find('.ads_pert').html(`Suggested: $`+(suggested)+`</div>`);
			}
		}
  	})
}

function load_data_ads() { // unused
	if ($('.ReactVirtualized__Grid__innerScrollContainer div[data-e2e-id="tableCell_cell_clicks"]').length > 0) {
		$('body h1').each(function() {
			if ($(this).attr('data-ccx-e2e-id') == 'aac-object-type') {
				campaign_name = $(this).find('span').text();
			}
		})

		obj = $('.ReactVirtualized__Grid__innerScrollContainer');
		obj.find('div[data-e2e-id="tableCell_cell_clicks"]').each(function() {
			idx = $(this).attr('data-e2e-index').split('_')[1] * 1;
			if (idx == 0)
				topClicks = getValue($(this).text());
			else if (idx == 1)
				productPagesClicks = getValue($(this).text());
			else if (idx == 2)
				restOfSearchClicks = getValue($(this).text());
		})
		obj.find('div[data-e2e-id="tableCell_cell_orders"]').each(function() {
			idx = $(this).attr('data-e2e-index').split('_')[1] * 1;
			if (idx == 0)
				topOrders = getValue($(this).text());
			else if (idx == 1)
				productPagesOrders = getValue($(this).text());
			else if (idx == 2)
				restOfSearchOrders = getValue($(this).text());
		})
		funcStart();
	} else {
		cur_times ++;
		if (cur_times <= max_times) {
			setTimeout(() => {
				load_data_ads();
			}, 2000)
		}
	}
}

function createPopup() {
	strHtml = `
		<div class='popads'>
			<div class='popads_close'>&#x2715;</div>
			<div class='popads_title'>Campaign:<span>`+campaign_name+`</span></div>
			<div class='popads_cont'></div>
		</div>
	`;
	$('body').append(strHtml);

	$('.popads_close').unbind('click');
	$('.popads_close').click(function() {
		$('.popads').removeClass('popads_show');
	})
}
function openPopup() {
	$('.popads_title').html(`Campaign:<span>`+campaign_name+`</span>`);
	$('.popads').addClass('popads_show');
}

//=================== calculate ====================
function funcStart() {
	if ($('.popads').length == 0)
		createPopup();

	topPlacement = 0;
	productPlacement = 0;
	bidMultiplier = 1;

	// Calculate the conversion rate for Top of Search, Product Pages, and Rest of Search
	topConversionRate = topOrders ? topOrders/topClicks : 1 / (topClicks * 2);
	productPageConversionRate = productPagesOrders ? productPagesOrders / productPagesClicks : 1 / (productPagesClicks * 2);
	restOfSearchConversionRate = restOfSearchOrders ? restOfSearchOrders / restOfSearchClicks : 1 / (restOfSearchClicks * 2);

	console.log('Top of Search Converion Rate', displayPercent(topConversionRate), '%');

	console.log('Product Pages Converion Rate', displayPercent(productPageConversionRate), '%');

	console.log('Rest of Search Converion Rate', displayPercent(restOfSearchConversionRate), '%');
	console.log("")

	// display values
	$('.popads_cont').html(`
		<div class='flex'>Top of Search Converion Rate:<span class='font_bold ml10'>`+displayPercent(topConversionRate)+` %</span></div>
		<div class='flex'>Product Pages Converion Rate:<span class='font_bold ml10'>`+displayPercent(productPageConversionRate)+` %</span></div>
		<div class='flex'>Rest of Search Converion Rate:<span class='font_bold ml10'>`+displayPercent(restOfSearchConversionRate)+` %</span></div>
	`);

	// Calculate the placements if top of search is better than product placemand, and product placement is better than rest of search
	if (topConversionRate > productPageConversionRate && productPageConversionRate >= restOfSearchConversionRate){

	    topPlacement = topConversionRate / restOfSearchConversionRate - 1;

	    scale = scaleFactor(topPlacement);
	    //scale = 1;
	    topPlacement = topPlacement * scale;

	    if (scale != 1){
	    		console.log('Scale', scale)
	        $('.popads_cont').append(`<div class='flex'>Scale:<span class='font_bold ml10'>`+scale+`</span></div>`);
	    }

	    console.log('Top of Search Placement', displayPercent(topPlacement), '%');
	    $('.popads_cont').append(`<div class='flex'>Top of Search Placement:<span class='font_bold ml10'>`+displayPercent(topPlacement)+` %</span></div>`);

	    productPlacement = productPageConversionRate / restOfSearchConversionRate - 1;
	    productPlacement = productPlacement * scale;
	    console.log('Product Page Placement', displayPercent(productPlacement), '%');
	    $('.popads_cont').append(`<div class='flex'>Product Page Placement:<span class='font_bold ml10'>`+displayPercent(productPlacement)+` %</span></div>`);

	    bidMultiplier = getBidMultiplier(topPlacement)
	    console.log('Bid Multiplier', Math.round(bidMultiplier * 100) / 100)
	    $('.popads_cont').append(`<div class='flex'>Bid Multiplier:<span class='font_bold ml10'>`+Math.round(bidMultiplier * 100) / 100+`</span></div>`);
	}

	// Calculate the placements if top of search is better than rest of search, and rest of search is better than product placement
	if (topConversionRate > restOfSearchConversionRate && restOfSearchConversionRate > productPageConversionRate){
	    topPlacement = topConversionRate / restOfSearchConversionRate - 1;
	    scale = scaleFactor(topPlacement);
	    if (scale != 1){
	        $('.popads_cont').append(`<div class='flex'>Scale:<span class='font_bold ml10'>`+scale+`</span></div>`);
	    }
	    topPlacement = topPlacement * scale;
	    console.log('Top of Search Placement', displayPercent(topPlacement), '%');
			$('.popads_cont').append(`<div class='flex'>Top of Search Placement:<span class='font_bold ml10'>`+displayPercent(topPlacement)+` %</span></div>`);

	    productPlacement = productPageConversionRate / restOfSearchConversionRate - 1;
	    productPlacement = productPlacement * scale;
	    productPlacement = 0;
	    $('.popads_cont').append(`<div class='flex'>Product Page Placement:<span class='font_bold ml10'>`+displayPercent(productPlacement)+` %</span></div>`);
			console.log('Product Page Placement', 0, '%');

	    bidMultiplier = getBidMultiplier(topPlacement);
	    //let bidMultiplier = 1 / (1 + topPlacement);
	   // bidMultiplier = bidMultiplier * (1/scale)
	    console.log('Bid Multiplier', Math.round(bidMultiplier * 100) / 100)
			$('.popads_cont').append(`<div class='flex'>Bid Multiplier:<span class='font_bold ml10'>`+Math.round(bidMultiplier * 100) / 100+`</span></div>`);

	}

	// Calculate it if product pages is best and top of search is 2nd best.
	if (productPageConversionRate > topConversionRate && topConversionRate >= restOfSearchConversionRate){
	    productPlacement = productPageConversionRate / restOfSearchConversionRate - 1;

	    scale = scaleFactor(productPlacement);
	    productPlacement = productPlacement * scale;

	    if (scale !== 1){
	        console.log('Scale factor', scale)
	        $('.popads_cont').append(`<div class='flex'>Scale factor:<span class='font_bold ml10'>`+scale+`</span></div>`);
	    }

	    topPlacement = topConversionRate / restOfSearchConversionRate - 1;
	    topPlacement = topPlacement * scale;

	    console.log('Top of Search Placement', displayPercent(topPlacement), '%');
			$('.popads_cont').append(`<div class='flex'>Top of Search Placement:<span class='font_bold ml10'>`+displayPercent(topPlacement)+` %</span></div>`);


	    console.log('Product Page Placement', displayPercent(productPlacement), '%');
			$('.popads_cont').append(`<div class='flex'>Product Page Placement:<span class='font_bold ml10'>`+displayPercent(productPlacement)+` %</span></div>`);

	    bidMultiplier = getBidMultiplier(productPlacement)
	    //bidMultiplier = bidMultiplier * (1/scale)
	    console.log('Bid Multiplier', Math.round(bidMultiplier * 100) / 100);
			$('.popads_cont').append(`<div class='flex'>Bid Multiplier:<span class='font_bold ml10'>`+Math.round(bidMultiplier * 100) / 100+`</span></div>`);

	}

	// Calculate the percentages if product pages is best and rest of search is second best. There's a bug in this somewhere
	// if (productPageConversionRate > topConversionRate && restOfSearchConversionRate >= topConversionRate){

	//     productPlacement = productPageConversionRate / restOfSearchConversionRate - 1;

	//     scale = scaleFactor(productPlacement);
	//     if (scale !== 1){
	//         console.log('Scale factor', scale)
	//         $('.popads_cont').append(`<div class='flex'>Scale factor:<span class='font_bold ml10'>`+scale+`</span></div>`);
	//     }
	//     productPlacement = productPlacement * scale;

	//     topPlacement = 0;


	//     console.log('Top of Search Placement', displayPercent(topPlacement), '%');
	// 		$('.popads_cont').append(`<div class='flex'>Top of Search Placement:<span class='font_bold ml10'>`+displayPercent(topPlacement)+` %</span></div>`);


	//     console.log('Product Page Placement', displayPercent(productPlacement), '%');
	// 		$('.popads_cont').append(`<div class='flex'>Product Page Placement:<span class='font_bold ml10'>`+displayPercent(productPlacement)+` %</span></div>`);

	//     bidMultiplier = getBidMultiplier(productPlacement)
	//     //bidMultiplier = bidMultiplier * (1/scale)
	//     console.log('Bid Multiplier', Math.round(bidMultiplier * 100) / 100);
	// 		$('.popads_cont').append(`<div class='flex'>Bid Multiplier:<span class='font_bold ml10'>`+Math.round(bidMultiplier * 100) / 100+`</span></div>`);

	// }

	obj = $('.ReactVirtualized__Grid__innerScrollContainer');
	obj.find('div[data-e2e-id="tableCell_cell_bidIncrease"]').each(function() {
		if ($(this).find('.ads_pert').length == 0) {
			idx = $(this).attr('data-e2e-index').split('_')[1] * 1;
			if (idx == 0)
				rate = topPlacement;
			else if (idx == 1)
				rate = productPlacement;
			if (idx != 2)
				$(this).append(`<div class='ads_pert'>Suggested: `+displayPercent(rate)+` %</div>`);
		} else {
			idx = $(this).attr('data-e2e-index').split('_')[1] * 1;
			if (idx == 0)
				rate = topPlacement;
			else if (idx == 1)
				rate = productPlacement;
			if (idx != 2)
				$(this).find('.ads_pert').html(`Suggested: `+displayPercent(rate)+` %</div>`);
		}
	})

}

function displayPercent(percent) {
	if (!isFinite(percent))
		return 0;
	else
    return Math.round(percent * 100 * 100) / 100
}

//Scale the suggested placement to maximum % provided, so we don't get really high placement percents.
function scaleFactor(placement, max = .32){
    if (placement > max){
        return max/placement;
    } else {
        return 1;
    }
}
function getBidMultiplier(bestPlacement){
    //console.log('best placement', bestPlacement)
    let bidMultiplier =  1 / (1 + bestPlacement);
    //console.log('original bid multiplier',  bidMultiplier)
    ret = 1- ((1 - bidMultiplier) / 2)

	if (!isFinite(ret))
		return '';
    return Math.round(ret*10000)/10000;
}
function getValue(val) {
	val = val.replace('-', '').replace(/,/g, "");
	return val * 1;
}
