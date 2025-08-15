// For the theme switcher / unneeded JS

$(document).ready(function() {
	$('#theme-none').click(function(e) {
		$('.theme').removeClass('theme-dark-trendy');
	});
	$('#theme-light').click(function(e) {
		$('.theme').removeClass('theme-dark-trendy');
	});
	$('#theme-dark').click(function(e) {
		$('.theme').removeClass('theme-dark-trendy');
	});
	$('#theme-dark-trendy').click(function(e) {
		$('.theme').addClass('theme-dark-trendy');
	});
});