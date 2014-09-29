<?php 
$task = $_POST['task'];
$obj=new stdClass();
$obj->state = '1';
if($task=='upload'){
	$imgname = uniqid();
	$base64 = $_POST['formFile'];
	$IMG = base64_decode( $base64 );
	//file_put_contents('upload/'. $imgname . '.png', $IMG );
	$obj->uid   = $imgname. '.png';
}else if($task =='vote'){
	$obj->name  = 'Benny';
}else{
	$obj->openid = '1346466';
}
print_r(json_encode($obj));
?>