<?php
header('Content-Type: application/json');

$country = $_GET['country'];

$conn = mysqli_connect("db_location", "db_username", "db_password", "db_dbname");
if (mysqli_connect_errno()) {
	die(mysqli_connect_error());
	exit();
}
$nameQuery = "SELECT * FROM gesMapFinal WHERE country_name='$country'";

$nameSelection = mysqli_query($conn, $nameQuery);
$numRows = mysqli_num_rows($nameSelection);

if ($numRows > 0) {
	//$row = mysqli_fetch_assoc($nameSelection);

	//Return JSON data with names
	$jsonString = '';
	for ($i = 0; $i < $numRows; $i++) {
		$row = mysqli_fetch_assoc($nameSelection);
		
		$countryName = addcslashes($row['country_name'], '"');
		$strategicText = addcslashes($row['strategic_text'], '"');
		$topicalText = addcslashes($row['topical_text'], '"');
		$historicalText = addcslashes($row['historical_text'], '"');
		
		$jsonString .= '{';
		$jsonString .= '"country": "'.$countryName.'",';
		$jsonString .= '"strategic_text": "'.$strategicText.'",';
		$jsonString .= '"topical_text": "'.$topicalText.'",';
		$jsonString .= '"historical_text": "'.$historicalText.'"';
		$jsonString .= '}';
	}
	$jsonString .= '';

	//Strip out line breaks etc
	$jsonString = preg_replace( "/\r|\n/", "", $jsonString );
} else {
	$jsonString = 'null';
}

echo $jsonString;
?>