CREATE TABLE `commutes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `start_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_time` timestamp NULL DEFAULT NULL,
  `total_time` int(11) DEFAULT NULL,
  `mpg` decimal(5,1) DEFAULT NULL,
  `length` decimal(5,1) DEFAULT NULL,
  `intermediate_timestamp` timestamp NULL DEFAULT NULL,
  `intermediate_time` int(11) DEFAULT NULL,
  `direction` enum('in','out') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `direction` (`direction`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1
